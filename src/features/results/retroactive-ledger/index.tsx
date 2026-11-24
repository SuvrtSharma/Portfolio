import type { Dashboard, HeadlineFigure } from "../types";
import { fmtRatio } from "../format";
import { proofCounts, speedStats } from "./derive";
import { evidence, speedEvidence } from "./evidence";
import { CounterexamplesView } from "./views/counterexamples";
import { OptimisationView } from "./views/optimisation";
import { OverviewView } from "./views/overview";
import { ProofsView } from "./views/proofs";
import { ProvenanceView } from "./views/provenance";
import { SpeedView } from "./views/speed";
import { TerminationView } from "./views/termination";

function headline(): HeadlineFigure[] {
  const p = proofCounts();
  const sp = speedStats();
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
      label: "Faster than a full rebuild",
      value: fmtRatio(sp.ratioMedian),
      detail: `Median, in their own code; faster on ${sp.faster} of ${sp.workloads} workloads, from ${fmtRatio(sp.ratioMin)} to ${fmtRatio(sp.ratioMax)}.`,
      tone: "positive",
    },
    {
      label: "Fork-and-sync didn't finish",
      value: `${sp.withReversals.workloads - sp.withReversals.finished} of ${sp.withReversals.workloads}`,
      detail: "Workloads with reversals, in their Haskell port; down to a four-activity case.",
      tone: "negative",
    },
  ];
}

export const retroactiveLedgerDashboard: Dashboard = {
  views: [
    { id: "overview", label: "Overview", description: "What was checked in a published ledger algorithm, how, and what held." },
    { id: "counterexamples", label: "Counterexamples", description: "Three cases where fork-and-sync ends somewhere else, in the model and in the project's own code." },
    { id: "optimisation", label: "A safe optimisation", description: "Rebuilding from the earliest affected point, proved exact and tested against wrong versions." },
    { id: "speed", label: "Speed", description: "The optimisation timed against fork-and-sync and a full rebuild, in the project's own code." },
    { id: "termination", label: "Does it finish?", description: "Four activities on which fork-and-sync doesn't finish, in the model and in both implementations." },
    { id: "proofs", label: "Proofs", description: "Every checker verdict against the owner's lock, and each claim's exact Lean statement." },
    { id: "provenance", label: "Provenance", description: "The commit and the SHA-256 of every evidence file, checked at build time." },
  ],
  run() {
    const s = evidence.source();
    return {
      run: `lock ${evidence.verdict("paymentConserved").lock_sha256.slice(0, 8)}`,
      measuredAt: s.checked_at,
      expires: speedEvidence.expires(),
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
      case "speed":
        return <SpeedView />;
      case "termination":
        return <TerminationView />;
      case "proofs":
        return <ProofsView />;
      case "provenance":
        return <ProvenanceView />;
      default:
        return null;
    }
  },
};
