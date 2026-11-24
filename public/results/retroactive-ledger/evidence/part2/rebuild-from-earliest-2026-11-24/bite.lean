import Spec.Retro
open Spec.Retro
/-! Bite checks for the two optimisation claims: plausible wrong versions of
the optimised step must fail, on the same exhaustive cases as pretest.lean
(every sequence of up to 3 events, every next event, dates 0..3). -/
def kinds : List Kind := [.disburse 10, .charge 3, .pay 5 .feeFirst, .pay 20 .principalFirst]
def seqs : Nat → List (List Event)
  | 0 => [[]]
  | n + 1 => (seqs n) ++ ((seqs n).filter (·.length == n)).flatMap fun pre =>
      let id := pre.length + 1
      let ks := kinds ++ (pre.map fun e => Kind.reverse e.id)
      (List.range 3).flatMap fun d => ks.map fun k => pre ++ [⟨id, d, k⟩]
def nexts (pre : List Event) : List Event :=
  let id := pre.length + 1
  let ks := kinds ++ (pre.map fun e => Kind.reverse e.id)
  [0, 1, 2, 3].flatMap fun d => ks.map fun k => ⟨id, d, k⟩
def pairs := (seqs 3).flatMap fun s => (nexts s).map (s, ·)
def insertCases := pairs.filter fun (s, e) => live (s ++ [e]) == live s ++ [e]
def removeCases := pairs.filterMap fun (s, r) => match r.kind with
  | .reverse t => if (live s).any (·.id == t) && live (s ++ [r]) == (live s).filter (·.id != t) then some (s, r, t) else none
  | _ => none

/-- The optimised arrival step, but putting the event at position `k`. -/
def insertAt (evs : List Event) (e : Event) (k : Nat) : Bal × List (Nat × Bal) :=
  let s := sortedLive evs
  let r := applyAll (balanceAt s k) (e :: s.drop k)
  (r.1, (rebuild evs).2.take k ++ r.2)
/-- The optimised reversal step, restarting at `k` and skipping `skip` events. -/
def removeAt (evs : List Event) (k skip : Nat) : Bal × List (Nat × Bal) :=
  let s := sortedLive evs
  let r := applyAll (balanceAt s k) (s.drop (k + skip))
  (r.1, (rebuild evs).2.take k ++ r.2)
/-- Reversal done locally: subtract the reversed event's own effect, re-apply nothing. -/
def removeLocal (evs : List Event) (t : Nat) : Bal × List (Nat × Bal) :=
  let k := positionOf (sortedLive evs) t
  let own := (((rebuild evs).2.drop k).head?.map (·.2)).getD Bal.zero
  ((rebuild evs).1.sub own, (rebuild evs).2.take k ++ (rebuild evs).2.drop (k + 1))

def failsI (f : List Event → Event → Bal × List (Nat × Bal)) : Nat :=
  (insertCases.filter fun (s, e) => rebuild (s ++ [e]) != f s e).length
def failsR (f : List Event → Nat → Bal × List (Nat × Bal)) : Nat :=
  (removeCases.filter fun (s, r, t) => rebuild (s ++ [r]) != f s t).length

#eval IO.println s!"arrival cases {insertCases.length}; the claimed step fails on {failsI rebuildFromInsert}"
#eval IO.println s!"  apply the late event at the end, as if on time: fails on {failsI fun s e => insertAt s e (sortedLive s).length}"
#eval IO.println s!"  put the late event one place too late: fails on {failsI fun s e => insertAt s e (min (insertionPoint (sortedLive s) e + 1) (sortedLive s).length)}"
#eval IO.println s!"  put the late event one place too early: fails on {failsI fun s e => insertAt s e (insertionPoint (sortedLive s) e - 1)}"
#eval IO.println s!"reversal cases {removeCases.length}; the claimed step fails on {failsR rebuildFromRemove}"
#eval IO.println s!"  restart at the reversed event but keep it: fails on {failsR fun s t => removeAt s (positionOf (sortedLive s) t) 0}"
#eval IO.println s!"  restart one event too late (the reversed effect stays in, the next is skipped): fails on {failsR fun s t => removeAt s (positionOf (sortedLive s) t + 1) 1}"
#eval IO.println s!"  subtract its own effect only, re-apply nothing after it: fails on {failsR removeLocal}"
