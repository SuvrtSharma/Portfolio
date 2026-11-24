import type { Dashboard, HeadlineFigure } from "../types";
import { fmtInt } from "../format";
import { optimisationTotals, proofCounts } from "./derive";
import { evidence } from "./evidence";
import { CounterexamplesView } from "./views/counterexamples";
import { OptimisationView } from "./views/optimisation";
import { OverviewView } from "./views/overview";
import { ProofsView } from "./views/proofs";
import { ProvenanceView } from "./views/provenance";

function headline(): HeadlineFigure[] {
  const p = proofCounts();
  const o = optimisationTotals();
  return [
    {
      label: "Proofs accepted",
      value: `${p.accepted} of ${p.total}`,
      detail: "Against the owner's lock, by a checker with two independent kernels.",
      tone: p.accepted === p.total ? "positive" : "negative",
    },
    {
      label: "Counterexamples",
      value: `${p.refutationsAccepted}`,
      detail: "Proofs that the paper's fork-and-sync, as modelled, doesn't always match a full rebuild.",
      tone: "negative",
    },
    {
      label: "Optimisation proved exact",
      value: `${p.optimisationAccepted} of ${p.optimisation}`,
      detail: "Rebuilding from the earliest affected point, for an arrival and for a reversal.",
      tone: "gold",
    },
    {
      label: "Tested before proving",
      value: fmtInt(o.tested),
      detail: `Cases the optimisation was run on first; it failed on ${fmtInt(o.failures)}.`,
      tone: o.failures === 0 ? "positive" : "negative",
    },
    {
      label: "Wrong versions caught",
      value: `${o.caught} of ${o.variants}`,
      detail: "Plausible shortcuts that must fail, and do.",
      tone: o.caught === o.variants ? "positive" : "negative",
    },
  ];
}

export const retroactiveLedgerDashboard: Dashboard = {
  views: [
    { id: "overview", label: "Overview", description: "What was checked in a published ledger algorithm, how, and what held." },
    { id: "counterexamples", label: "Counterexamples", description: "Three cases where fork-and-sync ends somewhere else, in the model and in the project's own code." },
    { id: "optimisation", label: "A safe optimisation", description: "Rebuilding from the earliest affected point, proved exact and tested against wrong versions." },
    { id: "proofs", label: "Proofs", description: "Every checker verdict against the owner's lock, and each claim's exact Lean statement." },
    { id: "provenance", label: "Provenance", description: "The commit and the SHA-256 of every evidence file, checked at build time." },
  ],
  run() {
    const s = evidence.source();
    return {
      run: `lock ${evidence.verdict("paymentConserved").lock_sha256.slice(0, 8)}`,
      measuredAt: s.checked_at,
      commit: evidence.checkedCommit(),
      uncommitted: [],
    };
  },
  headline,
  renderView(viewId) {
    switch (viewId) {
      case "overview":
        return <OverviewView figures={headline()} />;
      case "counterexamples":
        return <CounterexamplesView />;
      case "optimisation":
        return <OptimisationView />;
      case "proofs":
        return <ProofsView />;
      case "provenance":
        return <ProvenanceView />;
      default:
        return null;
    }
  },
};
