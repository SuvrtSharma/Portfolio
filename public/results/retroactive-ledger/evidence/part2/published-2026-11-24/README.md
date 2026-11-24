# Part 2 evidence prepared for the portfolio, 2026-11-24

Machine-readable files the portfolio's part 2 dashboard reads. Each is produced
by a command from raw files already in this repository; nothing is typed in.

| File | Produced by | From |
|---|---|---|
| `counterexamples.json` | `lake env lean counterexamples.lean` (in `part2/`) | the locked spec and proofs |
| `code-reproduction.json` | `make_published.py` | `evidence/plp/repro-haskell-2026-11-18.txt`, `evidence/plp/repro-java-2026-11-18.log.gz`, `evidence/part2/readings8-2026-11-23/code-check-original-*` |
| `java-results-extract.txt` | `make_published.py` | the result (`GODSHAND`) lines of the two Java logs |
| `optimisation.json` | `make_published.py` | `evidence/part2/rebuild-from-earliest-2026-11-24/pretest.out.txt`, `bite.out.txt` |

The Java Maven logs themselves are not published: besides the results they
print the service's connection details. Only their `GODSHAND` result lines are
extracted, and none of those contain connection details (checked with a
search for `jdbc`, `password` and the database address).
