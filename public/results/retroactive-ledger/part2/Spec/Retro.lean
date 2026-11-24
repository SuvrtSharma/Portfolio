/-
Part 2 spec, step 1: retroactive corrections with fixed amounts (no interest).

Written by an agent on 2026-11-18 and reviewed by the owner (ADR-0026). A claim
against it counts only when `part2/spec.lock.json` matches this file
(`python -m godshand.speclock verify --project part2`) and `leancheck` accepts
the proof. Only the owner creates or updates the lock (ADR-0025).

Two things are defined here, and the claims compare them:
- `rebuild`: the oracle. It applies every live event in business order from
  the start. This is the "correct branch" of the approved rules (LR8, LR9),
  taken from outside sources, not from the code under test.
- `forkSync`: the paper's algorithms as the paper states them (Appendix C:
  C1 backdated fork-and-sync, C2 reversal, C3 SYNC, C4 idempotent add). This
  models the paper, not the Java or Haskell code; conformance compares the
  code with this later.

Choices the owner should check (each is marked READING below):
1. Business order is `(eff, id)`: a business timestamp, then the event id,
   never arrival (LR8 same-day rule, LR10).
2. Payment allocation with no interest: each payment carries its order, as the
   code's spread string does (LR12: the order is a contract term). Fee first
   (the code's `FIP`) or principal first (its `IPF`, with no interest owed);
   the rest is held as excess (unapplied funds) (LR15). Disbursals and charges
   don't consume excess. Applying excess is a lifecycle event (LR15, LR20),
   which step 1 doesn't model. (Owner decision, 2026-11-22.)
3. A reversal targets an earlier-arrived disbursal, charge or payment, at most
   once. Anything else is rejected and changes nothing (LR20).
4. C2's replay excludes the reversal itself as well as its target. The paper's
   prose says the exclusion "prevents infinite recursion"; its pseudocode only
   names the target.
5. Classification follows the paper's Figure 1: a reversal always takes C2;
   any other event takes C1 if its date is before the ledger's latest entry
   date, otherwise it is applied directly.
6. The idempotency key is stable, as the paper claims (C4): (entry kind,
   source event, effective date).
7. Recursion is bounded by fuel. Running out is reported (`stuck`), never
   hidden; the claims only cover runs that don't run out.
8. Recording time (`createdAt`) follows arrival order, and an event is
   recorded after its own business date and after that of every event that
   arrived before it. The paper gives an adjustment the triggering activity's
   `createdAt` as its effective date (C1 step 7, C2 step 8); `recordedAt`
   computes it from the events that have arrived so far, never later ones.
   Future-dated events (recorded before their business date) are out of step
   1's scope. (Approved 2026-11-23, ADR-0027, after an outside review: the draft
   used the bare arrival index, on the same scale as business dates.)

Left out of step 1, so no claim here covers it: interest and rates (LR13,
LR14), rounding (no rates means nothing to round, LR2), several currencies
(LR1: one currency, minor units), closed periods (LR8), the payment lifecycle
beyond one reversal (LR20), and every production rule outside the model
(LR18 to LR23).

Money is an integer number of minor units (`Int`), never a float (LR1).
-/
/-- Insert into an already-sorted list by a `≤`-style Bool comparator. -/
def insOrd {α} (le : α → α → Bool) (x : α) : List α → List α
  | [] => [x]
  | y :: ys => if le x y then x :: y :: ys else y :: insOrd le x ys

/-- Insertion sort, same call shape as `List.mergeSort` (`xs.isort le`), but it
reduces in the kernel so claims over concrete inputs can be decided. -/
def List.isort {α} (xs : List α) (le : α → α → Bool) : List α :=
  xs.foldr (insOrd le) []

namespace Spec.Retro

/-! ## Money and balances (LR1, LR4) -/

/-- What the borrower owes, by component, plus excess: money received and not
yet applied (LR15). All in minor units. -/
structure Bal where
  fee : Int
  principal : Int
  excess : Int
  deriving Repr, DecidableEq

def Bal.zero : Bal := ⟨0, 0, 0⟩
def Bal.add (a b : Bal) : Bal := ⟨a.fee + b.fee, a.principal + b.principal, a.excess + b.excess⟩
def Bal.neg (a : Bal) : Bal := ⟨-a.fee, -a.principal, -a.excess⟩
def Bal.sub (a b : Bal) : Bal := a.add b.neg

/-! ## Events -/

/-- READING 2: the order in which a payment pays what is owed (LR12). With no
interest in step 1, the code's `FIP` is `feeFirst` and its `IPF` is
`principalFirst`. -/
inductive Alloc where
  | feeFirst
  | principalFirst
  deriving Repr, DecidableEq

inductive Kind where
  | disburse (amount : Int)
  | charge (amount : Int)
  | pay (amount : Int) (order : Alloc)
  | reverse (target : Nat)
  deriving Repr, DecidableEq

/-- An event as it arrives. `eff` is its business timestamp. Arrival order is
the order of the list the ledger is given (its posting sequence, LR3). -/
structure Event where
  id : Nat
  eff : Nat
  kind : Kind
  deriving Repr, DecidableEq

/-- READING 1: business order is `(eff, id)` (LR8, LR10). -/
def before (a b : Event) : Bool := a.eff < b.eff || (a.eff == b.eff && a.id ≤ b.id)

/-- Every constructor is spelled out (no catch-all branch): a catch-all
compiles to `Nat.hasNotBit`, which the checker's second kernel can't evaluate
yet. Same meaning. -/
def isReversal (e : Event) : Bool :=
  match e.kind with
  | .reverse _ => true
  | .disburse _ | .charge _ | .pay _ _ => false

/-- READING 2: the effect of one non-reversal event on a balance. A payment
pays the two components in its order, and the rest becomes excess (LR12,
LR15). -/
def effect (b : Bal) : Kind → Bal
  | .disburse a => ⟨0, a, 0⟩
  | .charge a => ⟨a, 0, 0⟩
  | .pay a .feeFirst =>
    let toFee := min a (max b.fee 0)
    let toPrincipal := min (a - toFee) (max b.principal 0)
    ⟨-toFee, -toPrincipal, a - toFee - toPrincipal⟩
  | .pay a .principalFirst =>
    let toPrincipal := min a (max b.principal 0)
    let toFee := min (a - toPrincipal) (max b.fee 0)
    ⟨-toFee, -toPrincipal, a - toFee - toPrincipal⟩
  | .reverse _ => Bal.zero

/-! ## Which events are valid (LR15, LR16, LR20) -/

def amountOf : Kind → Option Int
  | .disburse a | .charge a | .pay a _ => some a
  | .reverse _ => none

/-- READING 3: an event is accepted if its id is new and its amount positive.
A reversal is accepted if it targets an earlier accepted non-reversal event
that hasn't been reversed yet. Everything else is rejected and ignored. -/
def accept : List Event → List Event → List Event
  | acc, [] => acc.reverse
  | acc, e :: rest =>
    let fresh := !(acc.any fun x => x.id == e.id)
    let ok := match e.kind with
      | .reverse t =>
        acc.any (fun x => x.id == t && !isReversal x) &&
        !(acc.any fun x => x.kind == .reverse t)
      | .disburse _ | .charge _ | .pay _ _ => match amountOf e.kind with
        | some a => decide (0 < a)
        | none => false
    if fresh && ok then accept (e :: acc) rest else accept acc rest

/-- The accepted events, in arrival order. -/
def accepted (evs : List Event) : List Event := accept [] evs

def reversedIds (evs : List Event) : List Nat :=
  evs.filterMap fun e => match e.kind with
    | .reverse t => some t
    | .disburse _ | .charge _ | .pay _ _ => none

/-! ## The oracle: a full rebuild in business order (LR8, LR9) -/

/-- The live events: accepted, not reversals, not reversed. -/
def live (evs : List Event) : List Event :=
  let acc := accepted evs
  acc.filter fun e => !isReversal e && !(reversedIds acc).contains e.id

/-- Apply events in order, recording each one's effect. -/
def applyAll : Bal → List Event → Bal × List (Nat × Bal)
  | b, [] => (b, [])
  | b, e :: rest =>
    let d := effect b e.kind
    let (b', effs) := applyAll (b.add d) rest
    (b', (e.id, d) :: effs)

/-- The correct branch: the final balance and each live event's effect. -/
def rebuild (evs : List Event) : Bal × List (Nat × Bal) :=
  applyAll Bal.zero ((live evs).isort before)

/-! ## The ledger of the paper (section 4.1, Appendix C) -/

inductive EntryKind where
  | direct
  | compensation
  | adjustment
  deriving Repr, DecidableEq

/-- An entry: its change, its running balance after posting, the source
activity it is attributed to, and its effective date (Table C1). -/
structure Entry where
  kind : EntryKind
  source : Nat
  eff : Nat
  delta : Bal
  running : Bal
  deriving Repr, DecidableEq

/-- READING 6: the paper's stable idempotency key (C4). -/
def Entry.key (e : Entry) : EntryKind × Nat × Nat := (e.kind, e.source, e.eff)

abbrev Ledger := List Entry

def current (l : Ledger) : Bal :=
  match l.getLast? with
  | some e => e.running
  | none => Bal.zero

/-- C4: recompute the running balance against the tail, and silently skip the
entry if one with the same key exists. -/
def addEntry (l : Ledger) (e : Entry) : Ledger :=
  if l.any (fun x => x.key == e.key) then l
  else l ++ [{ e with running := (current l).add e.delta }]

def totalImpact (l : Ledger) (src : Nat) : Option Bal :=
  let xs := l.filter (·.source == src)
  if xs.isEmpty then none else some (xs.foldl (fun acc x => acc.add x.delta) Bal.zero)

/-- `rollbackToEntryBefore(t)`: entries effective at or before `t`. -/
def forkAtDate (l : Ledger) (t : Nat) : Ledger := l.filter (·.eff ≤ t)

/-- `rollbackToEntryBefore(type, id)`: the prefix before the source's first entry. -/
def forkBeforeSource (l : Ledger) (src : Nat) : Ledger := l.takeWhile (·.source != src)

def latestEff (l : Ledger) : Option Nat := l.foldl (fun m x => some (match m with | some v => max v x.eff | none => x.eff)) none

/-- Apply a non-reversal event directly at the tail. -/
def applyDirect (l : Ledger) (e : Event) : Ledger :=
  addEntry l ⟨.direct, e.id, e.eff, effect (current l) e.kind, Bal.zero⟩

/-- C3, SYNC: walk the fork's entries after `forkIndex` in effective-date order.
For each new source, add its entry if the primary has none; otherwise post one
adjustment for any difference in total impact. -/
def sync (primary fork : Ledger) (adjEff forkIndex : Nat) : Ledger :=
  let forkSorted := fork.isort (fun a b => a.eff ≤ b.eff)
  if forkSorted.isEmpty || primary.isEmpty then primary
  else
    let step := fun (st : Ledger × List Nat) (retro : Entry) =>
      let (p, processed) := st
      if processed.contains retro.source then st
      else
        let p' := match totalImpact p retro.source with
          | none => addEntry p retro
          | some pi =>
            let ri := (totalImpact fork retro.source).getD Bal.zero
            if ri == pi then p
            else addEntry p ⟨.adjustment, retro.source, adjEff, ri.sub pi, Bal.zero⟩
        (p', retro.source :: processed)
    ((forkSorted.drop forkIndex).foldl step (primary, [])).1

/-- The outcome of processing: the ledger, and whether fuel ran out. -/
structure Run where
  ledger : Ledger
  stuck : Bool

/-- READING 8: the event at arrival position `pos`'s recording time
(`createdAt`) on the business-time axis: after the business date of every event
that has arrived up to and including it, and increasing in arrival order. Only
events that have arrived are used, so later arrivals never change it. The paper
uses it as an adjustment's effective date (C1 step 7, C2 step 8). -/
def recordedAt (log : List Event) (pos : Nat) : Nat :=
  (log.take (pos + 1)).foldl (fun m e => max m e.eff) 0 + 1 + pos

/-- Algorithms C1 and C2, with `applyLedgerActivities`, as one recursion over
fuel. `log` is the accepted events in arrival order, and `now` is the arrival
position of the event being processed (its `createdAt`). -/
def applyActs (log : List Event) : Nat → Nat → Ledger → List (Nat × Event) → Run
  | 0, _, l, _ => ⟨l, true⟩
  | _ + 1, _, l, [] => ⟨l, false⟩
  | fuel + 1, now, l, (pos, e) :: rest =>
    let r := applyOne log fuel now l pos e
    if r.stuck then r else applyActs log fuel now r.ledger rest
where
  /-- READING 5: classify one activity as the paper's Figure 1 does. -/
  applyOne (log : List Event) : Nat → Nat → Ledger → Nat → Event → Run
    | 0, _, l, _, _ => ⟨l, true⟩
    | fuel + 1, now, l, pos, e =>
      let indexed := log.zipIdx
      match e.kind with
      | .reverse t =>
        -- C2: compensate the target's whole impact, fork before it, and replay
        -- what arrived after it, without it and without this reversal (READING 4).
        match totalImpact l t, indexed.find? (fun (x, _) => x.id == t) with
        | some imp, some (_, tPos) =>
          let l1 := addEntry l ⟨.compensation, t, e.eff, imp.neg, Bal.zero⟩
          let fork := forkBeforeSource l1 t
          let mapped : List (Nat × Event) :=
            (indexed.filter fun (x, i) => tPos < i && i ≤ now && x.id != e.id).map (fun (x, i) => (i, x))
          let replay := mapped.isort (fun a b => a.2.eff ≤ b.2.eff)
          let r := applyActs log fuel now fork replay
          if r.stuck then r else ⟨sync l1 r.ledger (recordedAt log pos) fork.length, false⟩
        | none, _ | some _, none => ⟨l, false⟩
      | .disburse _ | .charge _ | .pay _ _ =>  -- spelled out, as in `isReversal`
        match latestEff l with
        | some latest =>
          if e.eff < latest then
            -- C1: fork at the event's date, apply it there, mirror its entries,
            -- replay everything effective from its date that has arrived, then SYNC.
            let fork := forkAtDate l e.eff
            let fork1 := applyDirect fork e
            let l1 := (fork1.drop fork.length).foldl addEntry l
            let mapped : List (Nat × Event) :=
              (indexed.filter fun (x, i) => e.eff ≤ x.eff && i ≤ now).map (fun (x, i) => (i, x))
            let replay := mapped.isort (fun a b => a.2.eff ≤ b.2.eff)
            let r := applyActs log fuel now fork1 replay
            if r.stuck then r else ⟨sync l1 r.ledger (recordedAt log pos) fork.length, false⟩
          else ⟨applyDirect l e, false⟩
        | none => ⟨applyDirect l e, false⟩

/-- Process accepted events one at a time, in arrival order, as the system
would. Each event gets fresh fuel, enough for the paper's recursion on the
inputs we explore. Running out is reported, never hidden. -/
def forkSync (evs : List Event) (fuel : Nat := 64) : Run :=
  let log := accepted evs
  (log.zipIdx).foldl (fun (r : Run) (e, pos) =>
      if r.stuck then r
      else
        let r' := applyActs log fuel pos r.ledger [(pos, e)]
        r') ⟨[], false⟩

/-! ## What the claims compare (LR8, ADR-0024) -/

/-- The events whose total effect is compared: every accepted event except the
reversals themselves. That includes reversed events, whose total must be zero
(LR9); the rebuild gives them zero, so a residue left on one is caught.
(Owner decision, 2026-11-22.) -/
def subjects (evs : List Event) : List Event := (accepted evs).filter (!isReversal ·)

/-- The state compared: the current balance, and each subject's total effect. -/
def forkSyncState (evs : List Event) : Bal × List (Nat × Bal) :=
  let l := (forkSync evs).ledger
  (current l, (subjects evs).map fun e => (e.id, (totalImpact l e.id).getD Bal.zero))

def rebuildState (evs : List Event) : Bal × List (Nat × Bal) :=
  let (b, effs) := rebuild evs
  (b, (subjects evs).map fun e => (e.id, ((effs.find? (·.1 == e.id)).map (·.2)).getD Bal.zero))

/-- The total effect a state records for an event id, if it lists that id. -/
def impactOf (st : Bal × List (Nat × Bal)) (id : Nat) : Option Bal :=
  (st.2.find? (·.1 == id)).map (·.2)

/-! ## Claim statements (no proofs yet) -/

/-- LR8, LR9 (the paper's R1 and R4): whenever fork-and-sync finishes, it ends
where the full rebuild does. -/
def forkSyncMatchesRebuild : Prop :=
  ∀ evs : List Event, (forkSync evs).stuck = false → forkSyncState evs = rebuildState evs

/-- The refutation of `forkSyncMatchesRebuild`, stated as a proposition so the
checker can accept a proof of it, as part 1 does with `cappedMatchDisagrees`.
(ADR-0027.) -/
def forkSyncDisagreesWithRebuild : Prop := ¬ forkSyncMatchesRebuild

/-- LR3 (R2): posting only appends. Every run's ledger after one more event
starts with the ledger before it. -/
def appendOnly : Prop :=
  ∀ (evs : List Event) (e : Event), (forkSync evs).stuck = false → (forkSync (evs ++ [e])).stuck = false →
    (forkSync evs).ledger <+: (forkSync (evs ++ [e])).ledger

/-- LR6 (R3): every entry is attributed to an accepted event. -/
def entriesTraced : Prop :=
  ∀ evs : List Event, ∀ x ∈ (forkSync evs).ledger, (accepted evs).any (·.id == x.source)

/-- LR4: every running balance is the sum of the entries up to it. -/
def runningIsSum : Prop :=
  ∀ (evs : List Event) (i : Nat) (h : i < (forkSync evs).ledger.length),
    (forkSync evs).ledger[i].running =
      ((forkSync evs).ledger.take (i + 1)).foldl (fun acc x => acc.add x.delta) Bal.zero

/-- LR15 and LR12: a positive payment is fully accounted for, and allocated as
its order says. What it pays to fee and to principal is never negative and
never more than is owed; the rest is excess, which is never negative and
appears only once everything owed is paid; and the second component in its
order is paid only once the first is paid in full. (Strengthened 2026-11-22:
the identity alone holds for any allocation, so it could not fail.) -/
def paymentConserved : Prop :=
  ∀ (b : Bal) (a : Int) (o : Alloc), 0 < a →
    let d := effect b (.pay a o)
    let owedFee := max b.fee 0
    let owedPrincipal := max b.principal 0
    (-d.fee - d.principal + d.excess = a) ∧
    0 ≤ -d.fee ∧ -d.fee ≤ owedFee ∧
    0 ≤ -d.principal ∧ -d.principal ≤ owedPrincipal ∧
    0 ≤ d.excess ∧
    (0 < d.excess → -d.fee = owedFee ∧ -d.principal = owedPrincipal) ∧
    (o = .feeFirst → 0 < -d.principal → -d.fee = owedFee) ∧
    (o = .principalFirst → 0 < -d.fee → -d.principal = owedPrincipal)

/-- LR10: the outcome depends on business order, not arrival order. Two arrival
orders of the same accepted events (so each reversal arrives after its target,
READING 3) give the same balance and the same total effect for every event id.
(Fixed 2026-11-22: comparing the per-event lists directly failed on list order
alone, since they follow arrival.) -/
def rebuildIgnoresArrival : Prop :=
  ∀ evs evs' : List Event, accepted evs = evs → accepted evs' = evs' → evs.Perm evs' →
    (rebuildState evs).1 = (rebuildState evs').1 ∧
    ∀ id, impactOf (rebuildState evs) id = impactOf (rebuildState evs') id

/-! ## An optimisation of the oracle: rebuild from the earliest affected point

A full rebuild re-applies every live event. When one event arrives, or one is
reversed, the events before it in business order are not affected: their
effects, and the balance after them, stay the same. So a system can keep those
(its stored per-event effects, and the running balance at that point) and
re-apply only from the earliest affected point. These definitions describe
that optimised step; the two claims state it gives exactly the full rebuild.
Like the rebuild, it recomputes what follows the affected point; how an
implementation records that for audit (R2) is outside this claim.
(Approved 2026-11-24, ADR-0028.) -/

/-- The live events in business order: the list the rebuild applies. -/
def sortedLive (evs : List Event) : List Event := (live evs).isort before

/-- The balance after the first `k` events of a business-ordered list: what a
system keeps as the running balance after its `k`-th event. -/
def balanceAt (s : List Event) (k : Nat) : Bal := (applyAll Bal.zero (s.take k)).1

/-- Where a new event goes in business order: after every event it doesn't
come before. -/
def insertionPoint (s : List Event) (e : Event) : Nat :=
  (s.takeWhile (fun y => !before e y)).length

/-- The optimised step when `e` arrives and becomes live: keep the effects of
everything before its place, start from the balance there, and re-apply only
`e` and what follows it. -/
def rebuildFromInsert (evs : List Event) (e : Event) : Bal × List (Nat × Bal) :=
  let s := sortedLive evs
  let k := insertionPoint s e
  let r := applyAll (balanceAt s k) (e :: s.drop k)
  (r.1, (rebuild evs).2.take k ++ r.2)

/-- Where the live event with id `t` sits in business order. -/
def positionOf (s : List Event) (t : Nat) : Nat :=
  (s.takeWhile (fun y => y.id != t)).length

/-- The optimised step when the live event with id `t` is reversed: keep the
effects of everything before it, start from the balance there, and re-apply
only what follows it. -/
def rebuildFromRemove (evs : List Event) (t : Nat) : Bal × List (Nat × Bal) :=
  let s := sortedLive evs
  let k := positionOf s t
  let r := applyAll (balanceAt s k) (s.drop (k + 1))
  (r.1, (rebuild evs).2.take k ++ r.2)

/-- The optimisation keeps its meaning when an event arrives: if `e` becomes a
new live event, rebuilding from its place gives exactly the full rebuild, the
balance and every event's effect. -/
def rebuildFromInsertExact : Prop :=
  ∀ (evs : List Event) (e : Event), live (evs ++ [e]) = live evs ++ [e] →
    rebuild (evs ++ [e]) = rebuildFromInsert evs e

/-- The optimisation keeps its meaning when an event is reversed: if the
arriving event `r` takes the live event with id `t` out of the live set,
rebuilding from where `t` was gives exactly the full rebuild. -/
def rebuildFromRemoveExact : Prop :=
  ∀ (evs : List Event) (r : Event) (t : Nat), (∃ x ∈ live evs, x.id = t) →
    live (evs ++ [r]) = (live evs).filter (fun x => x.id != t) →
    rebuild (evs ++ [r]) = rebuildFromRemove evs t

end Spec.Retro
