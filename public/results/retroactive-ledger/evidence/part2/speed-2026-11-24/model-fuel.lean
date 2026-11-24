import Spec.Retro
open Spec.Retro
/-! The four-event sequence that exhausts the heap of Precise Ledger Pro's
Haskell port (investigate.out.txt), in the locked model of the paper. Ids are
renumbered 1..4 in arrival order; dates as in the code run (days 6, 9, 4, 2).
`forkSync` takes a fuel bound per arriving event and reports `stuck` when it
runs out; a run that needs more fuel at every bound is not finishing. -/
def seq4 : List Event :=
  [⟨1, 6, .disburse 10⟩, ⟨2, 9, .reverse 1⟩, ⟨3, 4, .disburse 10⟩, ⟨4, 2, .pay 5 .feeFirst⟩]

#eval [8, 16, 32, 64, 128, 256, 512].map fun f => (f, (forkSync seq4 f).stuck)
-- Each prefix on its own: which arrival makes it stop finishing?
#eval (List.range 5).map fun k => (k, (forkSync (seq4.take k) 64).stuck)
-- Without the reversal, or without either late event:
#eval ("no reversal", (forkSync [⟨1, 6, .disburse 10⟩, ⟨3, 4, .disburse 10⟩, ⟨4, 2, .pay 5 .feeFirst⟩] 512).stuck)
#eval ("no late disbursal", (forkSync [⟨1, 6, .disburse 10⟩, ⟨2, 9, .reverse 1⟩, ⟨4, 2, .pay 5 .feeFirst⟩] 512).stuck)
#eval ("no late payment", (forkSync [⟨1, 6, .disburse 10⟩, ⟨2, 9, .reverse 1⟩, ⟨3, 4, .disburse 10⟩] 512).stuck)
#eval ("rebuild", rebuildState seq4)
