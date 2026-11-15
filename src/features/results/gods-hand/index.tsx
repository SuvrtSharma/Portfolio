import type { Dashboard, HeadlineFigure } from "../types";
import { fmt1, fmtInt, fmtRatio } from "../format";
import { configSummaries, mutationCounts, proofCounts, requestTotals, verdictCounts } from "./derive";
import { evidence } from "./evidence";
import { FindingsView } from "./views/findings";
import { MeaningView } from "./views/meaning";
import { MethodView } from "./views/method";
import { OverviewView } from "./views/overview";
import { ProofsView } from "./views/proofs";
import { ProvenanceView } from "./views/provenance";
import { RigourView } from "./views/rigour";
import { SpeedView } from "./views/speed";

function headline(): HeadlineFigure[] {
  const proofs = proofCounts();
  const muts = mutationCounts();
  const verdicts = verdictCounts();
  const configs = configSummaries();
  const all = configs.find((c) => c.label === "ALL-ACCEPTED");
  const base = configs.find((c) => c.label === "baseline");
  const totals = requestTotals();
  return [
    {
      label: "Lean claims verified",
      value: `${proofs.verified} of ${proofs.total}`,
      detail: "Each through all eight checks, two independent kernels included.",
      tone: proofs.verified === proofs.total ? "positive" : "negative",
    },
    {
      label: "Checks that bite",
      value: `${muts.bit} of ${muts.total}`,
      detail: "Each check removed in turn; its tests failed every time.",
      tone: muts.bit === muts.total ? "positive" : "negative",
    },
    {
      label: "Optimisations accepted",
      value: `${verdicts.accepted} of ${verdicts.total}`,
      detail: `${verdicts.total - verdicts.accepted} rejected on meaning, before any timing.`,
      tone: "gold",
    },
    {
      label: "Accepted set vs baseline",
      value: all ? fmtRatio(all.ratio) : "—",
      detail: all && base ? `Median ${fmt1(all.median)} against ${fmt1(base.median)} requests per second.` : "",
      tone: "gold",
    },
    {
      label: "Failed requests",
      value: fmtInt(totals.errors),
      detail: `Of ${fmtInt(totals.requests)} requests in ${totals.rounds} measured rounds.`,
      tone: totals.errors === 0 ? "positive" : "negative",
    },
  ];
}

export const godsHandDashboard: Dashboard = {
  views: [
    { id: "overview", label: "Overview", description: "What was checked, how, and what the run shows." },
    { id: "speed", label: "Speed", description: "Throughput and latency of every configuration in every round, and the rule for calling a result." },
    { id: "proofs", label: "Proofs", description: "Every Lean claim about the ledger, its exact statement, and its result through all eight checks." },
    { id: "meaning", label: "Meaning verdicts", description: "Each optimisation claim judged before any timing: guarantees, Lean evidence and conformance." },
    { id: "rigour", label: "Do the checks bite?", description: "Each check removed in turn, the code change, and the tests that caught it." },
    { id: "findings", label: "Findings", description: "Everything learned, including failures, dead ends and the agent's own mistakes." },
    { id: "method", label: "How each number was made", description: "For every figure: the command, the raw file and field, and any calculation." },
    { id: "provenance", label: "Provenance", description: "Machine, images, commit, and the SHA-256 of every evidence file, checked at build time." },
  ],
  run() {
    const b = evidence.benchmark();
    return {
      run: b.run_id,
      measuredAt: b.started_at,
      expires: b.expires,
      commit: b.git.commit,
      uncommitted: b.git.dirty_files,
    };
  },
  headline,
  renderView(viewId) {
    switch (viewId) {
      case "overview":
        return <OverviewView figures={headline()} />;
      case "speed":
        return <SpeedView />;
      case "proofs":
        return <ProofsView />;
      case "meaning":
        return <MeaningView />;
      case "rigour":
        return <RigourView />;
      case "findings":
        return <FindingsView />;
      case "method":
        return <MethodView />;
      case "provenance":
        return <ProvenanceView />;
      default:
        return null;
    }
  },
};
