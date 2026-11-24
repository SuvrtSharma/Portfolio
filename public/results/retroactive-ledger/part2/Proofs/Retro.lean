/-
Part 2 proofs (ADR-0025). A theorem here counts as verified only when
`leancheck` accepts it against the owner's lock of `part2/Spec`; the record of
which ones have been is in evidence/part2/leancheck-*/.

Two directions:
- refutations of `forkSyncMatchesRebuild`: our formalization of the paper's
  fork-and-sync (Appendix C; how each step maps is in
  docs/part2/paper-model-mapping.md) does not always end where a full rebuild
  does;
- positive invariants of `rebuild` (the oracle), from docs/part2/ledger-rules.md.

What these prove is about the definitions in `Spec.Retro`. That the first
counterexample is the paper's defect rests on the mapping document and on its
reproduction in the Java and Haskell code (2026-11-18), not on Lean alone.
-/
import Spec.Retro

namespace Proofs.Retro
open Spec.Retro

/-! ## Refutations of `forkSyncMatchesRebuild` -/

/-- The smallest counterexample the differential search found and reproduced:
a disbursal effective at day 2 (arrives first), a disbursal effective at day 0
(arrives late), a payment of 20 effective at day 1 (arrives last). -/
def cex : List Event :=
  [⟨1, 2, .disburse 10⟩, ⟨2, 0, .disburse 10⟩, ⟨3, 1, .pay 20 .feeFirst⟩]

theorem cex_not_stuck : (forkSync cex).stuck = false := by decide

theorem cex_disagrees : forkSyncState cex ≠ rebuildState cex := by decide

/-- Our formalization of fork-and-sync does not match a full rebuild. On `cex`
the two differ in how money is allocated between components (principal 0 and
excess 0, against principal 10 and excess 10), not in the net position: the
fork through day 1 keeps an entry whose stored running balance includes an
entry the fork filtered out.

This case depends on two readings of the paper: a fork keeps its entries'
stored running balances, and `current` reads the last stored balance. Both
implementations make both choices (the case reproduces in each). With either
reading changed, this case agrees with the rebuild
(evidence/part2/mapping-2026-11-23/readings-needed.txt); `robust_disagrees`
below does not depend on them. -/
theorem forkSync_ne_rebuild : ¬ forkSyncMatchesRebuild := by
  intro h
  exact cex_disagrees (h cex cex_not_stuck)

/-- The same, as the spec's refutation proposition, for the checker. It uses
`cex`, not the tie case (which depends on our tie rule). `cex` makes no
adjustments, so it doesn't depend on READING 8. -/
theorem forkSyncDisagreesWithRebuild : Spec.Retro.forkSyncDisagreesWithRebuild :=
  forkSync_ne_rebuild

/-- A counterexample that doesn't depend on how a fork's balances are read: a
payment of 5 on day 1, a fee of 3 charged late on day 0, then a payment of 5 on
day 2. Distinct dates, no reversal. The model ends with fee −3 and excess 4
(the fee paid twice), against the rebuild's fee 0 and excess 7: the same net
position, allocated wrongly.

It still fails when the fork recomputes its running balances or `current` sums
the entries (tested by substituting those readings,
evidence/part2/mapping-2026-11-23/robust-counterexamples.txt). It does post one
adjustment, so it depends on READING 8 (an adjustment dated at recording time,
as the paper and both implementations do). The original Haskell port gives
exactly this state; the Java service gives the same wrong impact for the last
payment but reports the correct balance (2026-11-23,
evidence/part2/readings8-2026-11-23/). -/
def robustCex : List Event :=
  [⟨1, 1, .pay 5 .feeFirst⟩, ⟨2, 0, .charge 3⟩, ⟨3, 2, .pay 5 .feeFirst⟩]

theorem robust_not_stuck : (forkSync robustCex).stuck = false := by decide

theorem robust_disagrees : forkSyncState robustCex ≠ rebuildState robustCex := by decide

theorem forkSync_ne_rebuild_robust : ¬ forkSyncMatchesRebuild := by
  intro h
  exact robust_disagrees (h robustCex robust_not_stuck)

/-- `robustCex` as the spec's refutation proposition, for the checker (which
requires the statement written exactly). -/
theorem forkSyncDisagreesWithRebuild_robust : Spec.Retro.forkSyncDisagreesWithRebuild :=
  forkSync_ne_rebuild_robust

/-- A disagreement on a same-date tie. A disbursal of 10 (id 2) arrives, then a
payment of 5 (id 1) dated the same instant. Our oracle orders the tie by id, as
our rule LR8 requires, so the payment comes first and is held as excess. The
model of the paper applies an event dated on the ledger's latest date at the
tail, which is arrival order (READING 5), so the payment pays principal instead.

This refutes `forkSyncMatchesRebuild` as we stated it, with our tie rule. It is
not a defect of the paper on its own terms: the paper orders ties by arrival
and doesn't promise otherwise. (Corrected 2026-11-23 after an outside review.) -/
def tieCase : List Event := [⟨2, 0, .disburse 10⟩, ⟨1, 0, .pay 5 .feeFirst⟩]

theorem tie_not_stuck : (forkSync tieCase).stuck = false := by decide

theorem tie_disagrees : forkSyncState tieCase ≠ rebuildState tieCase := by decide

theorem forkSync_ne_rebuild_on_tie : ¬ forkSyncMatchesRebuild := by
  intro h
  exact tie_disagrees (h tieCase tie_not_stuck)

/-- The tie case as the spec's refutation proposition, for the checker. It
refutes the claim as stated with our tie rule (LR8), not the paper's. -/
theorem forkSyncDisagreesWithRebuild_tie : Spec.Retro.forkSyncDisagreesWithRebuild :=
  forkSync_ne_rebuild_on_tie

/-! ## Positive invariants of the rebuild -/

/-- What `min` picks, as facts `omega` can use. -/
theorem min_cases (x y : Int) : (min x y = x ∧ x ≤ y) ∨ (min x y = y ∧ y < x) := by
  rw [Int.min_def]; split <;> omega

/-- What `max` picks, as facts `omega` can use. -/
theorem max_cases (x y : Int) : (max x y = y ∧ x ≤ y) ∨ (max x y = x ∧ y < x) := by
  rw [Int.max_def]; split <;> omega

/-- LR15 and LR12: a positive payment is fully accounted for and allocated in
its order, never paying more than is owed. This is local to one payment and the
balance it is given; it says nothing about whether that balance is the right
historical state, which is exactly what `forkSync_ne_rebuild` shows can fail. -/
theorem paymentConserved : Spec.Retro.paymentConserved := by
  intro b a o ha
  have hF := max_cases b.fee 0
  have hP := max_cases b.principal 0
  cases o <;> simp only [effect, reduceCtorEq, false_implies, and_true, true_and, forall_const]
  · have h1 := min_cases a (max b.fee 0)
    have h2 := min_cases (a - min a (max b.fee 0)) (max b.principal 0)
    generalize min a (max b.fee 0) = x at h1 h2 ⊢
    generalize min (a - x) (max b.principal 0) = y at h2 ⊢
    generalize max b.fee 0 = F at hF h1 h2 ⊢
    generalize max b.principal 0 = P at hP h1 h2 ⊢
    omega
  · have h1 := min_cases a (max b.principal 0)
    have h2 := min_cases (a - min a (max b.principal 0)) (max b.fee 0)
    generalize min a (max b.principal 0) = x at h1 h2 ⊢
    generalize min (a - x) (max b.fee 0) = y at h2 ⊢
    generalize max b.fee 0 = F at hF h1 h2 ⊢
    generalize max b.principal 0 = P at hP h1 h2 ⊢
    omega

/-- Inserting is a permutation: the output has the same elements as `x :: l`. -/
theorem insOrd_perm {α} (le : α → α → Bool) (x : α) (l : List α) :
    (insOrd le x l).Perm (x :: l) := by
  induction l with
  | nil => exact .refl _
  | cons y ys ih =>
    unfold insOrd
    split
    · exact .refl _
    · exact (List.Perm.cons y ih).trans (List.Perm.swap x y ys)

/-- Sorting is a permutation: `isort` neither drops nor invents elements. -/
theorem isort_perm {α} (le : α → α → Bool) (l : List α) : (l.isort le).Perm l := by
  induction l with
  | nil => exact .refl _
  | cons y ys ih =>
    show (insOrd le y (ys.isort le)).Perm (y :: ys)
    exact (insOrd_perm le y (ys.isort le)).trans (List.Perm.cons y ih)

/-- `isort` keeps exactly the same elements as its input. -/
theorem mem_isort {α} (le : α → α → Bool) (a : α) (l : List α) :
    a ∈ l.isort le ↔ a ∈ l := (isort_perm le l).mem_iff

/-- `applyAll` reports exactly the ids of the events it is given, in order. -/
theorem applyAll_ids (b : Bal) (l : List Event) :
    ((applyAll b l).2).map (·.1) = l.map (·.id) := by
  induction l generalizing b with
  | nil => rfl
  | cons e rest ih =>
    show (e.id, effect b e.kind).1 :: ((applyAll (b.add (effect b e.kind)) rest).2).map (·.1)
          = e.id :: rest.map (·.id)
    rw [ih]

/-- LR6 for the oracle: every id the rebuild reports belongs to a live event. -/
theorem rebuild_ids_live (evs : List Event) :
    ∀ p ∈ (rebuild evs).2, p.1 ∈ (live evs).map (·.id) := by
  intro p hp
  have h1 : p.1 ∈ ((rebuild evs).2).map (·.1) := List.mem_map.mpr ⟨p, hp, rfl⟩
  rw [show (rebuild evs).2 = (applyAll Bal.zero ((live evs).isort before)).2 from rfl,
      applyAll_ids] at h1
  obtain ⟨e, he, hee⟩ := List.mem_map.mp h1
  exact List.mem_map.mpr ⟨e, (mem_isort _ _ _).mp he, hee⟩

/-! ## Toward order-independence: the sort is a correct, canonical linear sort -/

/-- A list is sorted by `le` when every earlier element is `≤` every later one. -/
abbrev Sorted {α} (le : α → α → Bool) (l : List α) : Prop :=
  l.Pairwise (fun a b => le a b = true)

/-- Inserting into a sorted list keeps it sorted, for a total, transitive `le`. -/
theorem insOrd_sorted {α} (le : α → α → Bool)
    (htotal : ∀ a b, le a b = false → le b a = true)
    (htrans : ∀ a b c, le a b → le b c → le a c) (x : α) :
    ∀ {l : List α}, Sorted le l → Sorted le (insOrd le x l) := by
  intro l
  induction l with
  | nil => intro _; simp [insOrd, Sorted]
  | cons c cs ih =>
    intro h
    rw [Sorted, List.pairwise_cons] at h
    obtain ⟨hc, hcs⟩ := h
    unfold insOrd
    split
    · next hxc =>
      rw [Sorted, List.pairwise_cons]
      refine ⟨?_, by rw [List.pairwise_cons]; exact ⟨hc, hcs⟩⟩
      intro a ha
      rcases List.mem_cons.mp ha with rfl | ha
      · exact hxc
      · exact htrans x c a hxc (hc a ha)
    · next hxc =>
      have hcx : le c x = true := htotal x c (by simpa using hxc)
      rw [Sorted, List.pairwise_cons]
      refine ⟨?_, ih hcs⟩
      intro a ha
      rcases List.mem_cons.mp ((insOrd_perm le x cs).mem_iff.mp ha) with rfl | ha
      · exact hcx
      · exact hc a ha

/-- `isort` produces a sorted list, for a total, transitive `le`. -/
theorem isort_sorted {α} (le : α → α → Bool)
    (htotal : ∀ a b, le a b = false → le b a = true)
    (htrans : ∀ a b c, le a b → le b c → le a c) :
    ∀ l : List α, Sorted le (l.isort le) := by
  intro l
  induction l with
  | nil => simp [List.isort, Sorted]
  | cons y ys ih =>
    show Sorted le (insOrd le y (ys.isort le))
    exact insOrd_sorted le htotal htrans y ih

/-- Two sorted lists that are permutations of each other are equal, when `le`
is antisymmetric on the elements of the first list (the classic uniqueness of a
sorted order, needing antisymmetry only where it is used). -/
theorem eq_of_sorted_perm {α} (le : α → α → Bool) :
    ∀ {l₁ l₂ : List α}, (∀ a ∈ l₁, ∀ b ∈ l₁, le a b → le b a → a = b) →
      l₁.Perm l₂ → Sorted le l₁ → Sorted le l₂ → l₁ = l₂ := by
  intro l₁
  induction l₁ with
  | nil => intro l₂ _ hp _ _; exact (List.perm_nil.mp hp.symm).symm
  | cons a t₁ ih =>
    intro l₂ hanti hp hs1 hs2
    cases l₂ with
    | nil => exact absurd (hp.mem_iff.mp (List.mem_cons_self ..)) (by simp)
    | cons b t₂ =>
      rw [Sorted, List.pairwise_cons] at hs1 hs2
      obtain ⟨ha_le, hst1⟩ := hs1
      obtain ⟨hb_le, hst2⟩ := hs2
      have hbMem : b ∈ a :: t₁ := hp.symm.mem_iff.mp (List.mem_cons_self ..)
      have hab : a = b := by
        have haMem : a ∈ b :: t₂ := hp.mem_iff.mp (List.mem_cons_self ..)
        rcases List.mem_cons.mp haMem with hA | hA
        · exact hA
        · rcases List.mem_cons.mp hbMem with hB | hB
          · exact hB.symm
          · exact hanti a (List.mem_cons_self ..) b hbMem (ha_le b hB) (hb_le a hA)
      subst hab
      have hanti' : ∀ x ∈ t₁, ∀ y ∈ t₁, le x y → le y x → x = y :=
        fun x hx y hy => hanti x (List.mem_cons_of_mem _ hx) y (List.mem_cons_of_mem _ hy)
      rw [ih hanti' ((List.perm_cons a).mp hp) hst1 hst2]

/-- Permutation-equal inputs sort to the same list, for a total, transitive `le`
that is antisymmetric on the input's elements. -/
theorem isort_eq_of_perm {α} (le : α → α → Bool)
    (htotal : ∀ a b, le a b = false → le b a = true)
    (htrans : ∀ a b c, le a b → le b c → le a c)
    {xs ys : List α} (hanti : ∀ a ∈ xs, ∀ b ∈ xs, le a b → le b a → a = b)
    (h : xs.Perm ys) : xs.isort le = ys.isort le :=
  eq_of_sorted_perm le
    (fun a ha b hb => hanti a ((mem_isort le a xs).mp ha) b ((mem_isort le b xs).mp hb))
    (((isort_perm le xs).trans h).trans (isort_perm le ys).symm)
    (isort_sorted le htotal htrans xs) (isort_sorted le htotal htrans ys)

/-- `before` is total. -/
theorem before_total (a b : Event) : before a b = false → before b a = true := by
  simp only [before, Bool.or_eq_false_iff, Bool.or_eq_true, Bool.and_eq_true,
             Bool.and_eq_false_iff, beq_iff_eq, decide_eq_true_eq, decide_eq_false_iff_not,
             beq_eq_false_iff_ne]
  omega

/-- `before` is transitive. -/
theorem before_trans (a b c : Event) : before a b → before b c → before a c := by
  simp only [before, Bool.or_eq_true, Bool.and_eq_true, beq_iff_eq, decide_eq_true_eq]
  omega

/-- `before` is NOT antisymmetric on all events: two events with the same id and
date but different kinds are each `before` the other. So antisymmetry can only
hold on a list whose ids are distinct. -/
theorem before_not_antisymm : ¬ ∀ a b : Event, before a b → before b a → a = b := by
  intro h
  have := h ⟨1, 0, .disburse 1⟩ ⟨1, 0, .charge 1⟩ (by decide) (by decide)
  cases this

/-- If each is `before` the other, they share an id. -/
theorem before_antisymm_ids (a b : Event) (h1 : before a b) (h2 : before b a) :
    a.id = b.id := by
  simp only [before, Bool.or_eq_true, Bool.and_eq_true, beq_iff_eq, decide_eq_true_eq] at h1 h2
  omega

/-- In a list with distinct ids, an id picks out one element. -/
theorem eq_of_id_eq {l : List Event} (hd : l.Pairwise (fun a b => a.id ≠ b.id)) :
    ∀ {a b : Event}, a ∈ l → b ∈ l → a.id = b.id → a = b := by
  induction l with
  | nil => intro a b ha; simp at ha
  | cons c cs ih =>
    intro a b ha hb hid
    rw [List.pairwise_cons] at hd
    obtain ⟨hc, hcs⟩ := hd
    rcases List.mem_cons.mp ha with rfl | ha'
    · rcases List.mem_cons.mp hb with rfl | hb'
      · rfl
      · exact absurd hid (hc b hb')
    · rcases List.mem_cons.mp hb with rfl | hb'
      · exact absurd hid.symm (hc a ha')
      · exact ih hcs ha' hb' hid

/-- A list chosen by an `if` keeps a property both branches have (the `then`
branch may use the condition). -/
theorem pairwise_ite {α} {R : α → α → Prop} {c : Prop} [Decidable c] {x y : List α}
    (hx : c → x.Pairwise R) (hy : y.Pairwise R) : (if c then x else y).Pairwise R := by
  split
  · next hc => exact hx hc
  · exact hy

/-- LR20-style uniqueness: `accept` only ever admits an event whose id is new,
so the accepted events have distinct ids. -/
theorem accept_distinct : ∀ (rest acc : List Event),
    acc.Pairwise (fun a b => a.id ≠ b.id) →
    (accept acc rest).Pairwise (fun a b => a.id ≠ b.id) := by
  intro rest
  induction rest with
  | nil =>
    intro acc h
    rw [accept, List.pairwise_reverse]
    exact h.imp (fun hne => Ne.symm hne)
  | cons e rest ih =>
    intro acc h
    simp only [accept]
    refine pairwise_ite (fun hok => ih (e :: acc) ?_) (ih acc h)
    rw [List.pairwise_cons]
    refine ⟨?_, h⟩
    intro y hy heq
    simp only [Bool.and_eq_true, Bool.not_eq_true', List.any_eq_false, beq_iff_eq] at hok
    exact hok.1 y hy heq.symm

/-- The live events have distinct ids. -/
theorem live_distinct (evs : List Event) : (live evs).Pairwise (fun a b => a.id ≠ b.id) := by
  unfold live accepted
  exact List.Pairwise.sublist (List.filter_sublist ..) (accept_distinct evs [] .nil)

/-- `before` is antisymmetric on the live events. -/
theorem live_before_antisymm (evs : List Event) :
    ∀ a ∈ live evs, ∀ b ∈ live evs, before a b → before b a → a = b :=
  fun _ ha _ hb h1 h2 => eq_of_id_eq (live_distinct evs) ha hb (before_antisymm_ids _ _ h1 h2)

/-- Order-independence of the balance (LR8/LR10, R4), with no hypothesis beyond
the permutation: permuting the live activities does not change the final
balance. -/
theorem rebuild_balance_perm {evs evs' : List Event} (h : (live evs).Perm (live evs')) :
    (rebuild evs).1 = (rebuild evs').1 := by
  show (applyAll Bal.zero ((live evs).isort before)).1
     = (applyAll Bal.zero ((live evs').isort before)).1
  rw [isort_eq_of_perm before before_total before_trans (live_before_antisymm evs) h]


/-! ## Arrival-order independence of the whole compared state (LR10)

`rebuild_balance_perm` covers the balance, given that the live lists are
permutations. This proves the spec's full `rebuildIgnoresArrival`: from two
arrival orders of the same accepted events, the same balance and the same
total effect for every event id. -/

/-- Two permutations agree on whether they contain an id. -/
theorem contains_eq_of_perm {l₁ l₂ : List Nat} (h : l₁.Perm l₂) (x : Nat) :
    l₁.contains x = l₂.contains x :=
  Bool.eq_iff_iff.mpr (by rw [List.contains_iff_mem, List.contains_iff_mem]; exact h.mem_iff)

/-- When the events are exactly the accepted ones, reordering them reorders the
live events and changes nothing else about them. -/
theorem live_perm {evs evs' : List Event} (h1 : accepted evs = evs) (h2 : accepted evs' = evs')
    (hp : evs.Perm evs') : (live evs).Perm (live evs') := by
  unfold live
  simp only [h1, h2]
  have hrev : (reversedIds evs).Perm (reversedIds evs') := by
    unfold reversedIds; exact hp.filterMap _
  have hpred : (fun e : Event => !isReversal e && !(reversedIds evs).contains e.id)
      = (fun e => !isReversal e && !(reversedIds evs').contains e.id) := by
    funext e; rw [contains_eq_of_perm hrev]
  rw [hpred]
  exact hp.filter _

/-- The same for the events whose effects are compared. -/
theorem subjects_perm {evs evs' : List Event} (h1 : accepted evs = evs) (h2 : accepted evs' = evs')
    (hp : evs.Perm evs') : (subjects evs).Perm (subjects evs') := by
  unfold subjects; rw [h1, h2]; exact hp.filter _

/-- The whole rebuild, balance and every effect, is the same for both orders. -/
theorem rebuild_eq_of_perm {evs evs' : List Event} (h1 : accepted evs = evs)
    (h2 : accepted evs' = evs') (hp : evs.Perm evs') : rebuild evs = rebuild evs' := by
  unfold rebuild
  rw [isort_eq_of_perm before before_total before_trans (live_before_antisymm evs) (live_perm h1 h2 hp)]

/-- Looking an id up in a list built from events finds it exactly when one of
the events has that id, and then finds the value for that id. -/
theorem find_key (g : Nat → Bal) (id : Nat) (l : List Event) :
    ((l.map fun e => (e.id, g e.id)).find? (·.1 == id)).map (·.2)
      = if id ∈ l.map (·.id) then some (g id) else none := by
  induction l with
  | nil => simp
  | cons e rest ih =>
    by_cases he : e.id = id
    · subst he; simp
    · have hne : (e.id == id) = false := by simpa using he
      simp only [List.map_cons, List.find?_cons, hne, ih, List.mem_cons]
      by_cases hm : id ∈ rest.map (·.id)
      · simp [hm]
      · simp [hm, Ne.symm he]

/-- LR10 for the oracle, in full: two arrival orders of the same accepted
events give the same balance and the same total effect for every event id. -/
theorem rebuildIgnoresArrival : Spec.Retro.rebuildIgnoresArrival := by
  intro evs evs' h1 h2 hp
  have hr := rebuild_eq_of_perm h1 h2 hp
  have hs := subjects_perm h1 h2 hp
  unfold rebuildState impactOf
  rw [hr]
  obtain ⟨b, effs⟩ := rebuild evs'
  refine ⟨rfl, fun id => ?_⟩
  have k1 := find_key (fun x => ((effs.find? (·.1 == x)).map (·.2)).getD Bal.zero) id (subjects evs)
  have k2 := find_key (fun x => ((effs.find? (·.1 == x)).map (·.2)).getD Bal.zero) id (subjects evs')
  dsimp only at k1 k2 ⊢
  rw [k1, k2]
  have hmem : id ∈ (subjects evs).map (·.id) ↔ id ∈ (subjects evs').map (·.id) :=
    (hs.map _).mem_iff
  by_cases hm : id ∈ (subjects evs).map (·.id)
  · rw [if_pos hm, if_pos (hmem.mp hm)]
  · rw [if_neg hm, if_neg (fun h => hm (hmem.mpr h))]


/-! ## Vacuity witnesses (leancheck requires one per claim with hypotheses)

Each shows the claim's hypotheses can hold, so its proof is not true merely
because nothing satisfies them. -/

/-- Two arrival orders of the same accepted events. The witness only needs the
hypotheses to hold, which `arrivalA = arrivalB` would also satisfy; that they
really differ is checked separately below. -/
def arrivalA : List Event := [⟨1, 0, .disburse 10⟩, ⟨2, 1, .charge 5⟩, ⟨3, 2, .reverse 1⟩]
def arrivalB : List Event := [⟨2, 1, .charge 5⟩, ⟨1, 0, .disburse 10⟩, ⟨3, 2, .reverse 1⟩]

theorem arrivalA_ne_arrivalB : arrivalA ≠ arrivalB := by decide

theorem rebuildIgnoresArrival_witness :
    ∃ evs evs' : List Event, ∃ (_ : accepted evs = evs), ∃ (_ : accepted evs' = evs'),
      ∃ (_ : evs.Perm evs'), True :=
  ⟨arrivalA, arrivalB, by decide, by decide, List.Perm.swap _ _ _, trivial⟩

/-- A payment of 8 meeting fee 5 and principal 10. -/
theorem paymentConserved_witness :
    ∃ (b : Bal) (a : Int) (o : Alloc), ∃ (_ : 0 < a), True :=
  ⟨⟨5, 10, 0⟩, 8, .feeFirst, by decide, trivial⟩

/-! ## Rebuild from the earliest affected point (an optimisation of the oracle)

`rebuildFromInsertExact` and `rebuildFromRemoveExact`: keeping everything before
the affected point and re-applying only what follows gives exactly the full
rebuild. The core facts: applying a list in two halves equals applying it
whole (`applyAll_append_fst`, `applyAll_append_snd`), and the new
business-ordered list is the old one with the event inserted, or removed, at
that point. -/

theorem applyAll_cons (b : Bal) (x : Event) (l : List Event) :
    applyAll b (x :: l) = ((applyAll (b.add (effect b x.kind)) l).1,
      (x.id, effect b x.kind) :: (applyAll (b.add (effect b x.kind)) l).2) := rfl

/-- Applying `xs ++ ys` ends where applying `ys` from the end of `xs` does. -/
theorem applyAll_append_fst (b : Bal) (xs ys : List Event) :
    (applyAll b (xs ++ ys)).1 = (applyAll (applyAll b xs).1 ys).1 := by
  induction xs generalizing b with
  | nil => rfl
  | cons x xs ih => rw [List.cons_append, applyAll_cons, applyAll_cons]; exact ih _

/-- And it records the effects of `xs`, then those of `ys` applied from there. -/
theorem applyAll_append_snd (b : Bal) (xs ys : List Event) :
    (applyAll b (xs ++ ys)).2 = (applyAll b xs).2 ++ (applyAll (applyAll b xs).1 ys).2 := by
  induction xs generalizing b with
  | nil => rfl
  | cons x xs ih =>
    rw [List.cons_append, applyAll_cons, applyAll_cons]
    show _ :: _ = _ :: _
    rw [ih]
    rfl

theorem applyAll_length (b : Bal) (l : List Event) : (applyAll b l).2.length = l.length := by
  have := congrArg List.length (applyAll_ids b l)
  simpa using this

theorem takeWhile_length_le {α} (p : α → Bool) (l : List α) :
    (l.takeWhile p).length ≤ l.length := by
  have := congrArg List.length (List.takeWhile_append_dropWhile (p := p) (l := l))
  rw [List.length_append] at this
  omega

theorem take_length_takeWhile {α} (p : α → Bool) (l : List α) :
    l.take (l.takeWhile p).length = l.takeWhile p := by
  induction l with
  | nil => rfl
  | cons a as ih => by_cases h : p a = true <;> simp [h, ih]

theorem drop_length_takeWhile {α} (p : α → Bool) (l : List α) :
    l.drop (l.takeWhile p).length = l.dropWhile p := by
  induction l with
  | nil => rfl
  | cons a as ih => by_cases h : p a = true <;> simp [h, ih]

/-- Inserting puts the element after every element it doesn't come before. -/
theorem insOrd_split {α} (le : α → α → Bool) (x : α) (s : List α) :
    insOrd le x s = s.takeWhile (fun y => !le x y) ++ x :: s.dropWhile (fun y => !le x y) := by
  induction s with
  | nil => rfl
  | cons y ys ih =>
    by_cases h : le x y = true
    · simp [insOrd, h, List.takeWhile_cons, List.dropWhile_cons]
    · simp [insOrd, h, List.takeWhile_cons, List.dropWhile_cons, ih]

/-- The effects a rebuild records for its first `k` events are those of
applying just those `k`. -/
theorem rebuild_take (evs : List Event) (k : Nat) (hk : k ≤ (sortedLive evs).length) :
    (rebuild evs).2.take k = (applyAll Bal.zero ((sortedLive evs).take k)).2 := by
  show (applyAll Bal.zero (sortedLive evs)).2.take k = _
  have := applyAll_append_snd Bal.zero ((sortedLive evs).take k) ((sortedLive evs).drop k)
  rw [List.take_append_drop] at this
  rw [this]
  apply List.take_left'
  rw [applyAll_length, List.length_take, Nat.min_eq_left hk]

/-- When `e` becomes a new live event, the new business-ordered list is the old
one with `e` inserted. -/
theorem sortedLive_insert {evs : List Event} {e : Event}
    (h : live (evs ++ [e]) = live evs ++ [e]) :
    (live (evs ++ [e])).isort before = insOrd before e (sortedLive evs) := by
  have hanti := live_before_antisymm (evs ++ [e])
  rw [h] at hanti ⊢
  rw [isort_eq_of_perm before before_total before_trans hanti List.perm_append_comm]
  rfl

/-- The optimisation is exact when an event arrives. -/
theorem rebuildFromInsertExact : Spec.Retro.rebuildFromInsertExact := by
  intro evs e h
  have hk : insertionPoint (sortedLive evs) e ≤ (sortedLive evs).length :=
    takeWhile_length_le _ _
  have hsplit : insOrd before e (sortedLive evs)
      = (sortedLive evs).take (insertionPoint (sortedLive evs) e)
          ++ e :: (sortedLive evs).drop (insertionPoint (sortedLive evs) e) := by
    rw [insOrd_split]; unfold insertionPoint
    rw [take_length_takeWhile, drop_length_takeWhile]
  have hreb : rebuild (evs ++ [e]) = applyAll Bal.zero (insOrd before e (sortedLive evs)) := by
    show applyAll Bal.zero ((live (evs ++ [e])).isort before) = _
    rw [sortedLive_insert h]
  rw [hreb, hsplit]
  unfold rebuildFromInsert
  dsimp only
  rw [rebuild_take evs _ hk]
  refine Prod.ext ?_ ?_
  · exact applyAll_append_fst _ _ _
  · exact applyAll_append_snd _ _ _

/-- In a list with distinct ids that contains `t`, dropping `t` is splitting
the list around it. -/
theorem filter_id_split (t : Nat) : ∀ (l : List Event),
    l.Pairwise (fun a b => a.id ≠ b.id) → (∃ x ∈ l, x.id = t) →
    l.filter (fun x => x.id != t) = l.take (positionOf l t) ++ l.drop (positionOf l t + 1) := by
  intro l
  induction l with
  | nil => intro _ hex; obtain ⟨x, hx, _⟩ := hex; simp at hx
  | cons a as ih =>
    intro hd hex
    rw [List.pairwise_cons] at hd
    obtain ⟨ha, hd'⟩ := hd
    by_cases hat : a.id = t
    · have h0 : positionOf (a :: as) t = 0 := by simp [positionOf, List.takeWhile_cons, hat]
      rw [h0, List.filter_cons, if_neg (by simp [hat])]
      simp only [List.take_zero, List.nil_append, Nat.zero_add, List.drop_one, List.tail_cons]
      apply List.filter_eq_self.mpr
      intro y hy
      have hne := ha y hy
      simp only [bne_iff_ne, ne_eq]
      intro hy'
      exact hne (hat.trans hy'.symm)
    · have hex' : ∃ x ∈ as, x.id = t := by
        obtain ⟨x, hx, hxt⟩ := hex
        rcases List.mem_cons.mp hx with hxa | hx'
        · exact absurd (hxa ▸ hxt) hat
        · exact ⟨x, hx', hxt⟩
      have hp : positionOf (a :: as) t = positionOf as t + 1 := by
        simp [positionOf, List.takeWhile_cons, hat]
      rw [hp, List.filter_cons, if_pos (by simp [hat]), ih hd' hex', List.take_succ_cons,
        List.drop_succ_cons, List.cons_append]

/-- When the live event `t` is taken out, the new business-ordered list is the
old one without it. -/
theorem sortedLive_remove {evs : List Event} {r : Event} {t : Nat}
    (h : live (evs ++ [r]) = (live evs).filter (fun x => x.id != t)) :
    (live (evs ++ [r])).isort before = (sortedLive evs).filter (fun x => x.id != t) := by
  rw [h]
  apply eq_of_sorted_perm before
  · intro a ha b hb
    have ha' := (List.mem_filter.mp ((mem_isort _ _ _).mp ha)).1
    have hb' := (List.mem_filter.mp ((mem_isort _ _ _).mp hb)).1
    exact live_before_antisymm evs a ha' b hb'
  · exact (isort_perm _ _).trans ((isort_perm before (live evs)).symm.filter _)
  · exact isort_sorted before before_total before_trans _
  · exact List.Pairwise.sublist (List.filter_sublist ..)
      (isort_sorted before before_total before_trans (live evs))

/-- The optimisation is exact when an event is reversed. -/
theorem rebuildFromRemoveExact : Spec.Retro.rebuildFromRemoveExact := by
  intro evs r t hex h
  have hd : (sortedLive evs).Pairwise (fun a b => a.id ≠ b.id) :=
    ((isort_perm before (live evs)).pairwise_iff (fun h => Ne.symm h)).mpr (live_distinct evs)
  have hex' : ∃ x ∈ sortedLive evs, x.id = t := by
    obtain ⟨x, hx, hxt⟩ := hex
    exact ⟨x, (mem_isort _ _ _).mpr hx, hxt⟩
  have hk : positionOf (sortedLive evs) t ≤ (sortedLive evs).length := takeWhile_length_le _ _
  have hreb : rebuild (evs ++ [r]) = applyAll Bal.zero
      ((sortedLive evs).take (positionOf (sortedLive evs) t)
        ++ (sortedLive evs).drop (positionOf (sortedLive evs) t + 1)) := by
    show applyAll Bal.zero ((live (evs ++ [r])).isort before) = _
    rw [sortedLive_remove h, filter_id_split t _ hd hex']
  rw [hreb]
  unfold rebuildFromRemove
  dsimp only
  rw [rebuild_take evs _ hk]
  refine Prod.ext ?_ ?_
  · exact applyAll_append_fst _ _ _
  · exact applyAll_append_snd _ _ _

/-! ### Witnesses for the optimisation claims

Each shows the claim's hypotheses can hold, on an interesting case: a payment
arriving late, before two events already in business order; and a reversal of
an event with others after it. -/

def insEvs : List Event := [⟨1, 2, .disburse 10⟩, ⟨2, 3, .charge 3⟩]
def insE : Event := ⟨3, 0, .pay 5 .feeFirst⟩

theorem rebuildFromInsertExact_witness :
    ∃ (evs : List Event) (e : Event), ∃ (_ : live (evs ++ [e]) = live evs ++ [e]), True :=
  ⟨insEvs, insE, by decide, trivial⟩

/-- The witness is a backdated arrival: it goes before both earlier events. -/
theorem insE_backdated : insertionPoint (sortedLive insEvs) insE = 0 ∧
    (sortedLive insEvs).length = 2 := by decide

def remEvs : List Event :=
  [⟨1, 0, .disburse 10⟩, ⟨2, 1, .pay 5 .feeFirst⟩, ⟨3, 2, .charge 3⟩]
def remR : Event := ⟨4, 3, .reverse 1⟩

theorem rebuildFromRemoveExact_witness :
    ∃ (evs : List Event) (r : Event) (t : Nat), ∃ (_ : ∃ x ∈ live evs, x.id = t),
      ∃ (_ : live (evs ++ [r]) = (live evs).filter (fun x => x.id != t)), True :=
  ⟨remEvs, remR, 1, ⟨⟨1, 0, .disburse 10⟩, by decide, rfl⟩, by decide, trivial⟩

/-- The witness reverses the first event in business order, with two after it. -/
theorem remR_not_last : positionOf (sortedLive remEvs) 1 = 0 ∧
    (sortedLive remEvs).length = 3 := by decide

end Proofs.Retro
