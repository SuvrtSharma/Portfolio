# How the part 2 spec maps to the paper (Appendix C)

Each paper step, the spec definition that models it (`part2/Spec/Retro.lean`),
and how faithful the model is:

- **literal:** does what the text says;
- **reading:** the text is ambiguous or silent, so we chose (the numbered
  READINGs in the spec header);
- **deviation:** the model knowingly differs.

Paper: the arXiv draft in the repository, `docs/paper/precise-ledger-pro-arxiv-draft.md`
(dated April 1, 2026), cited by section and algorithm step. Written 2026-11-23
in answer to an outside review that asked for this mapping. Supporting runs are
in `evidence/part2/mapping-2026-11-23/`.

## Data model

| Paper | Spec | Fidelity |
|---|---|---|
| Ledger entry: incremental change and running balance per component (§2.1, Table C1) | `Entry.delta`, `Entry.running`, `Bal` | literal for fee, principal and excess; step 1 has no interest |
| Running balance is "the running balance of the preceding entry plus the incremental change" (§2.1) | set by `addEntry` against the ledger's tail when the entry is added; never recomputed later (entries are immutable, §2.1, R2) | literal (see *the inconsistency* below) |
| `effectiveAt`, business time (Table C1) | `Entry.eff`, `Event.eff` | literal |
| `createdAt`, processing time (Table C1) | an event's arrival position (`pos`, `now`) | reading; see READING 8 (ADR-0027) |
| Source pair (type, id) (Table C1) | `Entry.source`, a single id | reading: one loan, and `accept` keeps ids unique across kinds |
| Entry types Disbursal, Payment, StartOfDay, Reversal, Adjustment (Table C1) | `EntryKind`: `direct` (an activity's own entry), `compensation` (the Reversal entry), `adjustment` | reading; StartOfDay is out of step 1 |
| "the primary ledger ordered by *effectiveAt*" (§2.1) | `Ledger` is a list in the order entries were added | **deviation from §2.1, literal to C4** (see below) |

## Ledger operations (§4.1)

| Paper | Spec | Fidelity |
|---|---|---|
| `rollbackToEntryBefore(effectiveAt)`: "a new ledger (fork) containing only entries with `effectiveAt` ≤ the given timestamp" | `forkAtDate l t := l.filter (·.eff ≤ t)` | literal for which entries are kept. That they keep the running balances they were stored with is a **reading**: the paper doesn't say whether a fork's balances are recomputed. The backdated counterexample needs it |
| `rollbackToEntryBefore(type, id)`: "excluding all entries from the first entry of a given source activity onward" | `forkBeforeSource`, `takeWhile` | literal |
| `calculateTotalImpact` | `totalImpact` | literal |
| `getCurrentBalance`, "the running multi-component balance" | `current`: the last entry's stored running balance | **reading**, matching the Java code (read 2026-11-15). The backdated counterexample needs it |

## Classification (§2.1, §4.2, §4.4, Figure 1)

| Paper | Spec | Fidelity |
|---|---|---|
| Backdated if `effectiveAt` precedes "the ledger's most recent entry" | `latestEff`: the latest date among entries | READING 5. "Most recent" could also mean the last-appended entry; the counterexample gives the same wrong final balance under both (`latest-entry-readings.out.txt`; per-event values not compared) |
| A reversal always takes Algorithm 2; others take Algorithm 1 if backdated, else apply directly | `applyActs.applyOne` | READING 5, literal to Figure 1 |
| Recursion during replay | `applyActs`, bounded by fuel | READING 7: running out is reported (`stuck`), and claims cover only runs that finish |

## Algorithm C1, backdated activity

| Step | Spec (`applyOne`, non-reversal branch) | Fidelity |
|---|---|---|
| 1. `fork ← rollbackToEntryBefore(a.effectiveAt)` | `forkAtDate l e.eff` | literal |
| 2. `forkIndex ← |fork.entries|` | `fork.length` | literal |
| 3. apply `a` to the fork | `applyDirect fork e` | literal |
| 4. mirror the new entries with `ledger.addEntry` | `(fork1.drop fork.length).foldl addEntry l` | literal; each is appended at the tail (C4) |
| 5. replay activities with `effectiveAt ≥ a.effectiveAt` and `createdAt ≤ now`, sorted by `effectiveAt` | filter on date and arrival position, stable sort on date | literal. The replay includes `a` itself; the idempotency key drops its duplicate entry |
| 6. `APPLY-LEDGER-ACTIVITIES(fork, …)` | `applyActs log fuel now fork1 replay` | literal |
| 7. `SYNC(ledger, fork, now, a.createdAt, forkIndex)` | `sync l1 r.ledger pos fork.length` | **deviation in the draft:** the adjustment's date is the arrival index, on the same scale as business dates. READING 8 (approved, ADR-0027) dates it at the triggering event's recording time: after the business date of every event that has arrived so far, never using later arrivals |

## Algorithm C2, reversal

| Step | Spec (`applyOne`, reversal branch) | Fidelity |
|---|---|---|
| 1. total impact of the target | `totalImpact l t` | literal |
| 2–3. compensation entry, effective `r.effectiveAt`, source the target | `addEntry l ⟨.compensation, t, e.eff, imp.neg, _⟩` | literal |
| Precondition: the target's entries exist | if not, nothing happens | reading |
| 4. `rollbackToEntryBefore(targetType, targetId)` | `forkBeforeSource l1 t` | literal |
| 5. `forkIndex` | `fork.length` | literal |
| 6. replay `createdAt` after the target's and ≤ now, excluding the target, sorted by date | `tPos < i && i ≤ now && x.id != e.id` | READING 4: also excludes the reversal itself. The pseudocode names only the target, but read literally it would replay the reversal into itself; the prose (§5.2) says the exclusion "prevents infinite recursion" |
| 7. `APPLY-LEDGER-ACTIVITIES` | `applyActs` | literal |
| 8. `SYNC(…, r.createdAt, …)` | `sync … pos …` | deviation in the draft, as C1 step 7 |

## Algorithm C3, SYNC

| Step | Spec (`sync`) | Fidelity |
|---|---|---|
| 1. fork entries sorted by `effectiveAt` | stable sort on `eff` | literal |
| 2. primary entries sorted | omitted | literal in effect: later steps only use `calculateTotalImpact`, which doesn't depend on order |
| 3. return if either is empty | same | literal |
| 5. from `forkIndex` on, each new source once: add its entry if the primary has none, otherwise post one adjustment for a differing total impact | same | literal. `forkIndex` counts the unsorted fork but indexes the sorted one, as the pseudocode does |

## Algorithm C4, adding an entry

| Step | Spec (`addEntry`) | Fidelity |
|---|---|---|
| Clone, recompute running balances against the current balance, skip if the key exists, append | same | literal |
| Key over (loanId, entryId, entryType, source pair, effectiveAt) | `Entry.key = (kind, source, eff)` | READING 6: one loan; and `entryId` is dropped, because a fresh per-entry id would never repeat, which would defeat the paper's stated purpose for the key (§5.3) |

## Not from the paper

- **Acceptance** (READING 3) and **allocation order** (READING 2) are ours, from
  the ledger rules: the paper defines neither.
- **Same-date ties.** The paper's replay sorts by `effectiveAt` only, so tied
  events keep their arrival order. The oracle orders ties by id because our LR8
  says "never by arrival". Disagreement on a tie is a disagreement with our
  rule; the paper doesn't promise otherwise.

## The inconsistency behind the backdated counterexample

The paper describes the primary ledger as "ordered by *effectiveAt*", with each
running balance equal to the preceding entry's plus the entry's own change
(§2.1). But C1 step 4 and C4 step 5 append every entry at the tail, including a
backdated one, and entries are never changed afterwards. Once a backdated entry
has arrived, the ledger is in arrival order, not date order, and its running
balances follow arrival order.

C1 step 1 then forks with a plain filter on dates. In the counterexample
(disbursal on day 2, then a disbursal on day 0, then a payment of 20 on day 1),
the fork through day 1 keeps only the day-0 disbursal. Its stored running
principal is 20, but the changes in the fork sum to 10
(`counterexample-cause.out.txt`). The payment is allocated against 20 instead of
10. The final position nets to zero either way; the error is in how the money
is allocated between components: principal 0 and excess 0 instead of principal
10 and excess 10 (under READING 2: a disbursal doesn't consume excess).

So the counterexample follows Appendix C's steps, but under two readings the
text leaves open: a fork keeps its entries' stored running balances, and the
current balance is the last entry's stored one. *(Corrected 2026-11-23: this
section first said it followed Appendix C "as written", using "only literal
steps".)* Change either reading and this case agrees with the rebuild: with the
fork's balances recomputed, or with the current balance summed from the
entries, `forkSync` ends at principal 10 and excess 10
(`readings-needed.txt`). Both implementations make both readings, which is why
the case reproduces in each (below). It also uses READING 5 (shown not to
matter here) and makes no adjustments, so READING 8 doesn't touch it.

The two alternative readings don't make fork-and-sync agree with the rebuild in
general. Over all 3,432 sequences of up to three events, 150 disagree under our
readings and 90 under each alternative; 43 of them, with distinct dates,
disagree under all three. Every one of those 43 posts an adjustment, so
whether a counterexample can avoid these two readings depends on how an
adjustment is dated, which is READING 8 (`readings-needed.txt`, committed
spec). The paper doesn't say how a ledger "ordered by *effectiveAt*" (§2.1)
squares with entries that are immutable and always appended (C4); we haven't
modelled a version that keeps date order.

The same case was reproduced in the Haskell port and the Java service on
2026-11-18 (`evidence/plp/repro-haskell-2026-11-18.txt`,
`evidence/plp/repro-java-2026-11-18.log.gz`): there the payment's impact was
principal −20 against −10 / +10 excess in business order. Both final balances
were zero, because the code also nets the later disbursal against excess
(review finding F8).
