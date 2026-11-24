# Speed of rebuilding from the earliest affected point, 2026-11-24

The speed half of ADR-0028, measured on Precise Ledger Pro's own Haskell port
(upstream `06bb4ce`, unmodified), and a finding about its fork-and-sync made
along the way. Raw files here. **Measurements expire 2027-02-22.**

## What was measured

`tools/plp/haskell/Bench.hs` (sha256 `04e618b2…`, recorded inside the run)
processes the same stream of activities with three engines, all built on their
code:

- **forkSync:** their `applyLedgerActivities`, one call per arriving activity,
  as their service does;
- **full:** a full rebuild from every live activity on each arrival, which is
  what our fix does;
- **partial:** rebuild from the earliest affected point (ADR-0028). The ledger
  is kept in business order, cut where the arriving activity goes (or where a
  reversed one was), and only what follows is re-applied, with their own
  `generateEntries`.

Each engine's state is forced after every arrival, as a system that stored it
would compute it.

**Workloads:** 32. 100, 200, 400 or 800 activities; 10% or 50% of them arriving
late; backdated a few days (recent) or anywhere back to the start (deep);
without reversals, or with 5% reversals. A deterministic generator makes the
same streams every time.

**Method** (`run-full.out.txt`, `summarise.py`, as in part 1, ADR-0020):
- one warm-up round, discarded, then three timed rounds, with the engines'
  order rotated each round;
- the median of the timed rounds;
- partial is called faster only if its slowest round beat full's fastest;
- forkSync is rejected on meaning (ADR-0027), so it is timed for reference only;
- a 60 s limit and a capped heap (`+RTS -M1800m`). An engine that doesn't
  finish in the warm-up round isn't timed again.

**Environment:** Intel i5-10300H, WSL2 kernel 6.18.58.1, Docker with 4 CPUs
(`--cpuset-cpus 0-3`) and 2.5 GB memory, `--network none`, GHC 9.6.6 at `-O2`
in the pinned `haskell:9.6.6` image. Run from 2026-11-24 09:34 to 10:12 UTC.

## Results (`run-full.out.summary.txt`)

- **Correctness first.** On all 32 workloads, partial equals full: the same
  balance and the same total impact for every live activity.
- **Partial is faster than full on 32 of 32**, by the strict rule above.
  Speedups range from 1.96× to 155.94×, with a median of 11.86×. The gain grows
  with the ledger's length, and is larger when late activities are recent
  (median 18.91×) than when they reach far back (4.34×), because the step
  re-applies only what follows the affected point.
- **Fork-and-sync without reversals** finishes on all 16 workloads and beats
  the full rebuild on 12 of them, so its cost saving is real. But it agrees
  with the full rebuild on only 1 of 16, and partial is faster than it on 16 of
  16.
- **Fork-and-sync with reversals** finishes on only 1 of 16 workloads, and that
  one disagrees with the full rebuild. The other 15 end in a heap overflow (10)
  or the time limit (5).

## Fork-and-sync does not finish on four events

`probe.out.txt` showed fork-and-sync timing out at 100 activities. The
investigation (`investigate.out.txt`) shrank a failing workload to four
activities. They exhaust the Haskell port's heap whether the activities are
applied one call at a time or all in one call, so it isn't the harness. Given
60 or 180 seconds, it still runs out of memory.

| Arrives | Activity | Effective |
|---|---|---|
| 1 | disburse 10 | day 6 |
| 2 | reverse activity 1 | day 9 |
| 3 | disburse 10 (late) | day 4 |
| 4 | pay 5 (late) | day 2 |

- **The model of the paper** (`model-fuel.lean` / `.out.txt`): `forkSync` runs
  out of fuel at every bound tried, from 8 to 512. Every 3-activity prefix
  finishes. Removing the reversal, the late disbursal or the late payment makes
  it finish. The full rebuild's answer is principal 10, excess 5.
- **The Java service** (`java-four-events-extract.txt`): posting the activities
  fails with `java.lang.StackOverflowError`. The trace repeats
  `performBackdatedActivity` (`LedgerService.java:170`) and
  `reverseLedgerActivity` (`LedgerService.java:210`) more than 200 times, each
  calling `applyLedgerActivities`.
- **The mechanism:** the late payment's replay includes the reversal, and the
  reversal's replay (activities created after its target, up to now) includes
  the late payment still being processed, so each starts the other again.
  Running out of every bound tried is consistent with not terminating, but it
  is not a proof of non-termination.

## Caveats

- **Their ledger is a list.** Adding an entry appends and scans for duplicates
  (`Ledger.Core.addEntry`), and reading the balance walks to the last entry.
  Every engine pays that cost, so absolute times reflect their implementation,
  and the full rebuild grows roughly with the cube of the ledger's length. The
  comparison is between strategies on the same primitives, not between ideal
  implementations.
- **Lookups.** Fork-and-sync's lookups scan the activity list, as the repro
  harness does, standing in for their database queries.
- **One machine, one run, three timed rounds.** The start and end times are
  given above. These figures expire on the date above.
- **Workload shape.** Fixed amounts and no interest, matching the locked
  model's step 1.

## For the portfolio

`nontermination.json` is produced from `model-fuel.out.txt`, `investigate.out.txt`
and `java-four-events-extract.txt` by `make_published.py` (each value keeps its
file and line). `run-full.out.summary.json` is produced from `run-full.out.txt`
by `summarise.py`. The full Java log (`java-four-events.log.gz`) is not
published: it prints connection details.
