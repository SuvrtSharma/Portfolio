-- Speed of three ways to process retroactive events, all on Precise Ledger
-- Pro's own Haskell port (upstream 06bb4ce, unmodified):
--
--   forkSync  their applyLedgerActivities, one call per arriving activity, as
--             their service does (fork-and-sync, Appendix C);
--   full      a full rebuild from every live activity on each arrival (what
--             our fix does): drop reversals and reversed activities, sort by
--             (effectiveAt, activityType, activityId), apply with their
--             generateEntries from an empty ledger;
--   partial   rebuild from the earliest affected point (ADR-0028): keep the
--             ledger in business order, cut it where the arriving activity
--             goes (or where a reversed one was), and re-apply only what
--             follows, with the same generateEntries.
--
-- Each engine's state is forced after every arrival, as a system that stores
-- it would; otherwise laziness would skip work that is thrown away.
--
-- Before timing, every workload is checked: partial must equal full (balance
-- and every live activity's total impact). forkSync's disagreements with full
-- are counted and reported, not hidden.
--
-- Output: one line per fact, prefixed ENV, CHECK, TIME or DONE, each followed by
-- a JSON object. Build and run (no network; GHC boot packages only):
--   ghc -O2 -i<their haskell/src> -outputdir /tmp/o -o /tmp/bench Bench.hs
--   /tmp/bench quick | /tmp/bench full
module Main (main) where

import Control.Exception (SomeException, evaluate, try)
import Data.Bits (shiftR)
import Data.List (foldl', sortBy)
import Data.Ord (comparing)
import Data.Time (LocalTime (..), addDays, addLocalTime, fromGregorian, midnight, secondsToDiffTime, timeToTimeOfDay)
import Data.Word (Word64)
import GHC.Clock (getMonotonicTimeNSec)
import System.Environment (getArgs)
import System.IO (BufferMode (..), hSetBuffering, stdout)
import System.Timeout (timeout)
import Text.Printf (printf)
import Ledger.Activity (generateEntries)
import Ledger.Balance (totalAmount)
import Ledger.Core (calculateTotalImpact, currentBalance)
import Ledger.Entry (entryBalance)
import Ledger.Service (ActivityLookup (..), applyLedgerActivities)
import Ledger.Types

-------------------------------------------------------------------- workload

data Regime = Recent | Deep deriving (Eq, Show)

data Config = Config { cN :: Int, cLate :: Double, cRegime :: Regime, cRev :: Double, cSeed :: Word64 }

loan :: String
loan = "L1"

-- Business time: 2024-01-01 plus d days; the activity's index in seconds keeps every timestamp distinct.
effAt :: Integer -> Int -> LocalTime
effAt d i = LocalTime (addDays d (fromGregorian 2024 1 1)) (timeToTimeOfDay (secondsToDiffTime (fromIntegral i)))

-- Arrival (createdAt): after every business time, one second per arrival.
createdAt' :: Int -> LocalTime
createdAt' i = addLocalTime (fromIntegral i) (LocalTime (fromGregorian 2040 1 1) midnight)

-- A 64-bit linear congruential generator (Knuth's MMIX constants): deterministic, no packages.
next :: Word64 -> Word64
next s = s * 6364136223846793005 + 1442695040888963407

-- A uniform number in [0, 1) and the next state.
uniform :: Word64 -> (Double, Word64)
uniform s = let s' = next s in (fromIntegral (s' `shiftR` 11) / 9007199254740992, s')

-- An integer in [0, k) and the next state.
below :: Int -> Word64 -> (Int, Word64)
below k s = let (u, s') = uniform s in (min (k - 1) (floor (u * fromIntegral k)), s')

-- n activities in arrival order: disbursals, fees and payments, a share of them
-- backdated, and some reversals of earlier, not yet reversed activities.
workload :: Config -> [LedgerActivity]
workload cfg = go 0 0 [] (cSeed cfg)
  where
    go i day cands s
      | i >= cN cfg = []
      | otherwise =
          let (u, s1) = uniform s
          in if u < cRev cfg && not (null cands)
               then
                 let (j, s2) = below (length cands) s1
                     t = cands !! j
                     r = ReversalActivityData loan "Reversal" "Reversal" (show i) (effAt day i) (createdAt' i) "Transaction" t
                 in r : go (i + 1) day (take j cands ++ drop (j + 1) cands) s2
               else
                 let (kindU, s2) = uniform s1
                     (lateU, s3) = uniform s2
                     late = lateU < cLate cfg && day > 0
                     (lag, s4) = case cRegime cfg of
                       Recent -> below (fromIntegral (min 5 day)) s3
                       Deep -> below (fromIntegral day) s3
                     (day', eff) = if late then (day, day - 1 - fromIntegral lag) else (day + 1, day + 1)
                     tx name amt dir spread = TransactionActivity loan name "Transaction" (show i) (effAt eff i) (createdAt' i) amt dir spread
                     a | kindU < 0.40 = tx "Disbursal" 10 Credit "P"
                       | kindU < 0.55 = tx "Fee" 3 Credit "F"
                       | kindU < 0.85 = tx "Payment" 5 Debit "FIP"
                       | otherwise = tx "Payment" 20 Debit "FIP"
                 in a : go (i + 1) day' (show i : cands) s4

isRev :: LedgerActivity -> Bool
isRev ReversalActivityData{} = True
isRev _ = False

key :: LedgerActivity -> (LocalTime, String, String)
key a = (laEffectiveAt a, laActivityType a, laActivityId a)

emptyLedger :: Ledger
emptyLedger = Ledger loan zeroBalance [] "USD"

-- Forces every entry: what a system that stores the ledger would compute.
checksum :: Ledger -> Double
checksum l = foldl' (\acc e -> acc + totalAmount (entryBalance e)) 0 es + fromIntegral (length es)
  where es = ledgerEntries l

-------------------------------------------------------------------- engines

-- Same lookups as the repro harness: the Java repository's bounds, on the activities that exist.
lookupsFor :: [LedgerActivity] -> ActivityLookup
lookupsFor acts = ActivityLookup
  { lookupActivitiesAfter = \_ eff before ->
      sortBy (comparing laEffectiveAt) [a | a <- acts, laEffectiveAt a >= eff, laCreatedAt a < before]
  , lookupActivitiesCreatedSince = \_ _ aId before ->
      case [laCreatedAt a | a <- acts, laActivityId a == aId] of
        (t : _) -> [a | a <- acts, laCreatedAt a > t, laCreatedAt a <= before]
        [] -> []
  }

-- Their fork-and-sync, one activity per call, threading ledger and clock.
runForkSync :: [LedgerActivity] -> (Ledger, Double)
runForkSync acts = (\(l, _, s) -> (l, s)) (foldl' step (emptyLedger, defaultClock, 0) acts)
  where
    lk = lookupsFor acts
    step (l, c, acc) a =
      let (l', c') = applyLedgerActivities lk Nothing [a] l c
          s = checksum l'
      in s `seq` (l', c', acc + s)

rebuildAll :: [LedgerActivity] -> Ledger
rebuildAll acts = foldl' (\l a -> generateEntries a Nothing l) emptyLedger ordered
  where
    reversed = [laReversedActivityId r | r@ReversalActivityData{} <- acts]
    live = [a | a <- acts, not (isRev a), laActivityId a `notElem` reversed]
    ordered = sortBy (comparing key) live

-- A full rebuild from every activity so far, on each arrival.
runFull :: [LedgerActivity] -> (Ledger, Double)
runFull acts = foldl' step (emptyLedger, 0) [1 .. length acts]
  where
    step (_, acc) k = let l = rebuildAll (take k acts); s = checksum l in s `seq` (l, acc + s)

-- The live activities in business order, each with the number of ledger entries before it.
data PState = PState { psLive :: [(LedgerActivity, Int)], psLedger :: !Ledger }

-- Re-apply activities from a cut ledger, recording where each one's entries start.
reapply :: Ledger -> [LedgerActivity] -> (Ledger, [(LedgerActivity, Int)])
reapply l [] = (l, [])
reapply l (a : rest) =
  let n = length (ledgerEntries l)
      l' = generateEntries a Nothing l
  in n `seq` l' `seq` (let (lf, rest') = reapply l' rest in (lf, (a, n) : rest'))

cutAt :: Ledger -> Int -> Ledger
cutAt l n = l { ledgerEntries = take n (ledgerEntries l) }

-- Rebuild from the earliest affected point.
arrive :: PState -> LedgerActivity -> PState
arrive (PState live l) a
  | isRev a =
      case break (\(x, _) -> laActivityId x == laReversedActivityId a) live of
        (before, (_, n) : after) ->
          let (l', after') = reapply (cutAt l n) (map fst after) in PState (before ++ after') l'
        (_, []) -> PState live l
  | otherwise =
      let (before, after) = span (\(x, _) -> key x < key a) live
          n = case after of
            (_, m) : _ -> m
            [] -> length (ledgerEntries l)
          (l', after') = reapply (cutAt l n) (a : map fst after)
      in PState (before ++ after') l'

runPartial :: [LedgerActivity] -> (Ledger, Double)
runPartial acts = (\(st, s) -> (psLedger st, s)) (foldl' step (PState [] emptyLedger, 0) acts)
  where
    step (st, acc) a = let st' = arrive st a; s = checksum (psLedger st') in s `seq` (st', acc + s)

-------------------------------------------------------------------- checks

near :: Balance -> Balance -> Bool
near x y = all (\f -> abs (f x - f y) < 0.005) [balFee, balInterest, balPrincipal, balExcess]

-- Do two final ledgers agree on the balance and every live activity's total impact?
agree :: [LedgerActivity] -> Ledger -> Ledger -> Bool
agree acts x y =
  near (currentBalance x) (currentBalance y)
    && and [ case (calculateTotalImpact "Transaction" i x, calculateTotalImpact "Transaction" i y) of
               (Just a, Just b) -> near a b
               (Nothing, Nothing) -> True
               _ -> False
           | i <- ids ]
  where
    reversed = [laReversedActivityId r | r@ReversalActivityData{} <- acts]
    ids = [laActivityId a | a <- acts, not (isRev a), laActivityId a `notElem` reversed]

-- Activities (not reversals) dated before some activity that arrived earlier.
backdatedCount :: [LedgerActivity] -> Int
backdatedCount = snd . foldl' step (Nothing, 0)
  where
    step (m, c) a
      | isRev a = (m, c)
      | otherwise = case m of
          Just mx | laEffectiveAt a < mx -> (Just mx, c + 1)
          _ -> (Just (maybe (laEffectiveAt a) (max (laEffectiveAt a)) m), c)

-------------------------------------------------------------------- investigation

-- Their engine in one call over every activity, as their own tests use it.
runForkSyncBatch :: [LedgerActivity] -> (Ledger, Double)
runForkSyncBatch acts = let l = fst (applyLedgerActivities (lookupsFor acts) Nothing acts emptyLedger defaultClock)
                        in (l, checksum l)

data Outcome = Finished Double | TimedOut | Failed String deriving Show

outcomeJson :: Outcome -> [(String, String)]
outcomeJson (Finished s) = [("outcome", str "finished"), ("seconds", printf "%.4f" s)]
outcomeJson TimedOut = [("outcome", str "timed out")]
outcomeJson (Failed e) = [("outcome", str "failed"), ("error", str (take 120 e))]

-- Run with a time limit, catching a heap overflow (run with +RTS -M...) as a failure.
attempt :: Int -> ([LedgerActivity] -> (Ledger, Double)) -> [LedgerActivity] -> IO Outcome
attempt secs f acts = do
  t0 <- getMonotonicTimeNSec
  r <- try (timeout (secs * 1000000) (evaluate (snd (f acts))))
  t1 <- getMonotonicTimeNSec
  return $ case r of
    Left e -> Failed (show (e :: SomeException))
    Right Nothing -> TimedOut
    Right (Just _) -> Finished (fromIntegral (t1 - t0) / 1e9)

bad :: Outcome -> Bool
bad (Finished _) = False
bad _ = True

-- Drop one activity (and any reversal of it), keeping the sequence valid.
without :: [LedgerActivity] -> Int -> [LedgerActivity]
without acts i =
  let gone = laActivityId (acts !! i)
  in [a | (j, a) <- zip [0 ..] acts, j /= i, not (isRev a && laReversedActivityId a == gone)]

-- Greedily remove activities while the run still goes bad.
shrink :: Int -> ([LedgerActivity] -> (Ledger, Double)) -> [LedgerActivity] -> IO [LedgerActivity]
shrink secs f acts = go acts 0
  where
    go xs i
      | i >= length xs = return xs
      | otherwise = do
          let ys = without xs i
          o <- attempt secs f ys
          if bad o then go ys i else go xs (i + 1)

describe :: LedgerActivity -> String
describe a = case a of
  ReversalActivityData{} -> printf "%s: reverse %s, effective %s, arrives %s" (laActivityId a) (laReversedActivityId a) (show (laEffectiveAt a)) (show (laCreatedAt a))
  _ -> printf "%s: %s, effective %s, arrives %s" (laActivityId a) (laCommonName a) (show (laEffectiveAt a)) (show (laCreatedAt a))

investigate :: IO ()
investigate = do
  putStrLn ("ENV " ++ json [("mode", str "investigate"), ("limit_seconds", "20")])
  let cases = [Config 100 0.1 Recent 0.05 (fromIntegral (100 * 7919 :: Int)), Config 25 0.5 Deep 0.05 (fromIntegral (25 * 7919 :: Int))]
      runners = [("forkSync per arrival", runForkSync), ("forkSync one call", runForkSyncBatch)]
  mapM_ (\c -> do
          let acts = workload c
          mapM_ (\(rn, f) -> do
                  o <- attempt 20 f acts
                  putStrLn ("RUN " ++ json ([("config", str (name c)), ("runner", str rn),
                                             ("reversals", show (length (filter isRev acts))),
                                             ("backdated", show (backdatedCount acts))] ++ outcomeJson o)))
                runners)
        cases
  -- Shrink the heavy case to a smallest sequence that still goes bad, for each calling pattern.
  mapM_ (\(rn, f) -> do
          let acts = workload (cases !! 1)
          o <- attempt 5 f acts
          if not (bad o) then putStrLn ("SHRINK " ++ json [("runner", str rn), ("note", str "does not go bad within 5 s")]) else do
            small <- shrink 5 f acts
            o' <- attempt 30 f small
            putStrLn ("SHRINK " ++ json ([("runner", str rn), ("activities", show (length small)),
                                          ("reversals", show (length (filter isRev small)))] ++ outcomeJson o'))
            mapM_ (putStrLn . ("  " ++) . describe) small
            -- Does it finish with more time? (slow, or not finishing at all)
            mapM_ (\s -> do
                    r <- attempt s f small
                    putStrLn ("RETRY " ++ json ([("runner", str rn), ("limit_seconds", show s)] ++ outcomeJson r)))
                  [60, 180])
        runners
  putStrLn "DONE {}"

-------------------------------------------------------------------- timing

name :: Config -> String
name c = printf "n=%d late=%.2f %s rev=%.2f" (cN c) (cLate c) (show (cRegime c)) (cRev c)

json :: [(String, String)] -> String
json kvs = "{" ++ concatMap id (zipWith (\i (k, v) -> (if i > 0 then ", " else "") ++ show k ++ ": " ++ v) [0 :: Int ..] kvs) ++ "}"

str :: String -> String
str = show

-- Seconds and checksum, or Nothing if the run exceeds the limit (in seconds).
timeIt :: Int -> (a -> (Ledger, Double)) -> a -> IO (Maybe (Double, Double))
timeIt limit f x = do
  t0 <- getMonotonicTimeNSec
  r <- timeout (limit * 1000000) (evaluate (snd (f x)))
  t1 <- getMonotonicTimeNSec
  return (fmap (\s -> (fromIntegral (t1 - t0) / 1e9, s)) r)

timeLine :: [(String, String)] -> Maybe (Double, Double) -> String
timeLine ctx r = "TIME " ++ json (ctx ++ case r of
  Just (secs, s) -> [("seconds", printf "%.6f" secs), ("checksum", printf "%.4f" s), ("timed_out", "false")]
  Nothing -> [("seconds", "null"), ("checksum", "null"), ("timed_out", "true")])

engines :: [(String, [LedgerActivity] -> (Ledger, Double))]
engines = [("forkSync", runForkSync), ("full", runFull), ("partial", runPartial)]

-- The engines' order in round r: a fixed rotation, so each engine runs first, second and third equally often.
orderFor :: Int -> [a] -> [a]
orderFor r xs = let k = r `mod` length xs in drop k xs ++ take k xs

main :: IO ()
main = do
  hSetBuffering stdout LineBuffering
  args <- getArgs
  let mode = case args of (m : _) -> m; [] -> "quick"
      limit = 60
  case mode of
    "probe" -> probe
    "investigate" -> investigate
    _ -> run mode limit

-- Each engine alone on growing sizes, with a time limit, to see where each becomes impractical.
probe :: IO ()
probe = do
  putStrLn ("ENV " ++ json [("mode", str "probe"), ("limit_seconds", "120")])
  mapM_ (\(late, reg) ->
          mapM_ (\n ->
                  mapM_ (\(en, f) -> do
                          let c = Config n late reg 0.05 (fromIntegral (n * 7919))
                              acts = workload c
                          _ <- evaluate (length acts)
                          r <- timeIt 120 f acts
                          putStrLn (timeLine [("config", str (name c)), ("engine", str en)] r))
                        engines)
                [25, 50, 100, 200, 400])
        [(0.1, Recent), (0.5, Deep)]
  putStrLn "DONE {}"

run :: String -> Int -> IO ()
run mode limit = do
  let sizes = if mode == "full" then [100, 200, 400, 800] else [50, 100]
      rounds = 3 :: Int
      configs = [ Config n late reg rev (fromIntegral (n * 7919) + (if reg == Deep then 1 else 0) + (if rev > 0 then 2 else 0))
                | rev <- [0, 0.05], n <- sizes, late <- [0.1, 0.5], reg <- [Recent, Deep] ]
  putStrLn ("ENV " ++ json [("mode", str mode), ("rounds", show rounds), ("warmup_rounds", "1"),
                             ("engines", show (map fst engines)), ("limit_seconds", show limit),
                             ("rule", str "an engine that does not finish within the limit in the warm-up round is not timed again")])
  -- Correctness first: partial against full, and how forkSync relates to full when it finishes.
  mapM_ (\c -> do
          let acts = workload c
              (lf, _) = runFull acts
              (lp, _) = runPartial acts
          k <- attempt limit runForkSync acts
          let fs = case k of
                Finished _ -> if agree acts (fst (runForkSync acts)) lf then "true" else "false"
                TimedOut -> str "did not finish (time limit)"
                Failed e -> str ("did not finish (" ++ take 40 e ++ ")")
          putStrLn ("CHECK " ++ json [("config", str (name c)), ("activities", show (length acts)),
                                       ("reversals", show (length (filter isRev acts))), ("backdated", show (backdatedCount acts)),
                                       ("partial_equals_full", if agree acts lp lf then "true" else "false"),
                                       ("forkSync_equals_full", fs)]))
        configs
  -- Then timing: one warm-up round (discarded), then interleaved rounds.
  let go r skip
        | r > rounds = return ()
        | otherwise = do
            skip' <- foldl (\acc c -> do
                      s <- acc
                      let acts = workload c
                      _ <- evaluate (length acts)
                      foldl (\acc2 (en, f) -> do
                               s2 <- acc2
                               if (name c, en) `elem` s2
                                 then do
                                   putStrLn ("TIME " ++ json [("round", show r), ("warmup", "false"), ("config", str (name c)),
                                                              ("engine", str en), ("seconds", "null"), ("checksum", "null"),
                                                              ("timed_out", "true"), ("skipped", "true")])
                                   return s2
                                 else do
                                   o <- attempt limit f acts
                                   let ctx = [("round", show r), ("warmup", if r == 0 then "true" else "false"),
                                              ("config", str (name c)), ("engine", str en)]
                                   case o of
                                     Finished secs -> do
                                       putStrLn ("TIME " ++ json (ctx ++ [("seconds", printf "%.6f" secs), ("checksum", "null"),
                                                                        ("timed_out", "false")]))
                                       return s2
                                     _ -> do
                                       putStrLn ("TIME " ++ json (ctx ++ [("seconds", "null"), ("checksum", "null"),
                                                                        ("timed_out", "true")] ++ drop 0 (outcomeJson o)))
                                       return (if r == 0 then (name c, en) : s2 else s2))
                            (return s) (orderFor r engines))
                    (return skip) configs
            go (r + 1) skip'
  go 0 []
  putStrLn ("DONE " ++ json [("configs", show (length configs))])
