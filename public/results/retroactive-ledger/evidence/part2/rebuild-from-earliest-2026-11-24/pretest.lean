import Spec.Retro
open Spec.Retro
/-! Exhaustive test of the two claims before proving them: every sequence of up
to 3 events and every next event (dates 0..3, every kind, reversals). -/
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
#eval IO.println s!"insert cases: {insertCases.length}, of which backdated (insertion point before the end): {(insertCases.filter fun (s, e) => insertionPoint (sortedLive s) e < (sortedLive s).length).length}, claim fails on: {(insertCases.filter fun (s, e) => rebuild (s ++ [e]) != rebuildFromInsert s e).length}"
#eval IO.println s!"remove cases: {removeCases.length}, of which not the last in business order: {(removeCases.filter fun (s, _, t) => positionOf (sortedLive s) t + 1 < (sortedLive s).length).length}, claim fails on: {(removeCases.filter fun (s, r, t) => rebuild (s ++ [r]) != rebuildFromRemove s t).length}"
