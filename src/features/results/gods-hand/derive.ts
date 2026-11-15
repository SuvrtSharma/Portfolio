/**
 * Every figure the dashboard computes, rather than reads, is computed here.
 * Each function is small and named, and the Method tab lists them by name, so
 * a reader can find the exact code behind any number that isn't in a file.
 */
import { evidence, type Allocation, type Rep } from "./evidence";

/* ------------------------------------------------------------------ labels */

/** Short names for charts and tables. The full titles come from the claim records. */
const SHORT: Record<string, string> = {
  baseline: "Baseline",
  "ALL-ACCEPTED": "All accepted",
  "OPT-WAL": "WAL",
  "OPT-REUSE-CONNECTION": "Reuse connections",
  "OPT-INDEX-PARTY": "Index on party",
  "OPT-CACHED-BALANCE": "Cached balance",
  "OPT-CAP-SETTLE-SCAN": "Capped bill scan",
  "OPT-WAL-NORMAL": "WAL, synchronous=NORMAL",
};
export const shortName = (label: string) => SHORT[label] ?? label;

/* ------------------------------------------------------------------ helpers */

/** Middle value of the sorted list, or the mean of the middle two. */
export function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/* ------------------------------------------------------------------ speed */

export type Role = "baseline" | "accept" | "reject" | "combined";
export type SpeedCall = "faster" | "slower" | "noise" | "baseline";

export interface ConfigSummary {
  label: string;
  name: string;
  title: string;
  role: Role;
  /** Throughput of each round, in run order. */
  rounds: number[];
  median: number;
  min: number;
  max: number;
  /** Median over the baseline's median. */
  ratio: number;
  call: SpeedCall;
  requests: number;
  errors: number;
  reps: Rep[];
}

/**
 * One summary per configuration, ordered baseline, accepted claims, the
 * accepted set combined, then rejected claims.
 *
 * The speed call: faster only if the configuration's slowest round beat the
 * baseline's fastest round; slower only if its fastest round lost to the
 * baseline's slowest; anything in between is inside the noise.
 */
export function configSummaries(): ConfigSummary[] {
  const { runs } = evidence.benchmark();
  const verdicts = evidence.verdicts().verdicts;
  const throughput = (reps: Rep[]) => reps.map((r) => r.overall.throughput_rps);
  const baseRun = runs.find((r) => r.label === "baseline");
  if (!baseRun) throw new Error("benchmark.json has no baseline run");
  const base = throughput(baseRun.reps);
  const bMin = Math.min(...base);
  const bMax = Math.max(...base);
  const bMed = median(base);

  const roleOf = (label: string): Role => {
    if (label === "baseline") return "baseline";
    if (label === "ALL-ACCEPTED") return "combined";
    return verdicts.find((v) => v.id === label)?.verdict === "accept" ? "accept" : "reject";
  };
  const titleOf = (label: string) =>
    label === "baseline"
      ? "The ledger before any optimisation, with a durable database setting"
      : label === "ALL-ACCEPTED"
        ? "Every accepted optimisation applied together"
        : (verdicts.find((v) => v.id === label)?.title ?? label);
  const order: Record<Role, number> = { baseline: 0, accept: 1, combined: 2, reject: 3 };

  return runs
    .map((run) => {
      const xs = throughput(run.reps);
      const role = roleOf(run.label);
      const min = Math.min(...xs);
      const max = Math.max(...xs);
      const call: SpeedCall =
        role === "baseline" ? "baseline" : min > bMax ? "faster" : max < bMin ? "slower" : "noise";
      return {
        label: run.label,
        name: shortName(run.label),
        title: titleOf(run.label),
        role,
        rounds: xs,
        median: median(xs),
        min,
        max,
        ratio: median(xs) / bMed,
        call,
        requests: sum(run.reps.map((r) => r.overall.requests)),
        errors: sum(run.reps.map((r) => r.overall.errors)),
        reps: run.reps,
      };
    })
    .sort((a, b) => order[a.role] - order[b.role]);
}

/** Requests and failed requests over every configuration and round. */
export function requestTotals() {
  const all = evidence.benchmark().runs.flatMap((r) => r.reps);
  return {
    requests: sum(all.map((r) => r.overall.requests)),
    errors: sum(all.map((r) => r.overall.errors)),
    rounds: all.length,
  };
}

/** Operation names in the order the load generator records them. */
export function operations(): string[] {
  return Object.keys(evidence.benchmark().runs[0].reps[0].by_op);
}

/** Per configuration and operation: the median over rounds of each round's p99, in ms. */
export function p99ByOperation() {
  const ops = operations();
  return configSummaries().map((c) => ({
    label: c.label,
    name: c.name,
    role: c.role,
    p99: Object.fromEntries(ops.map((op) => [op, median(c.reps.map((r) => r.by_op[op].p99_ms))])) as Record<string, number>,
  }));
}

/** Share of successful requests per operation, over every configuration and round. */
export function observedMix() {
  const ops = operations();
  const reps = evidence.benchmark().runs.flatMap((r) => r.reps);
  const okOf = (op: string) => sum(reps.map((r) => r.by_op[op].ok));
  const total = sum(ops.map(okOf));
  return ops.map((op) => ({ op, ok: okOf(op), share: okOf(op) / total }));
}

/* ------------------------------------------------------------------ meaning */

export function verdictCounts() {
  const vs = evidence.verdicts().verdicts;
  return { accepted: vs.filter((v) => v.verdict === "accept").length, total: vs.length };
}

/**
 * The shrunk counterexample, compared allocation by allocation: which bills
 * the spec paid that the store didn't, and the advance each left over.
 */
export function counterexampleComparison() {
  const v = evidence.verdicts().verdicts.find((x) => x.evidence.conformance.shrunk_counterexample);
  const ce = v?.evidence.conformance.shrunk_counterexample;
  if (!v || !ce) return null;
  const key = (a: Allocation) => `${a.bill}`;
  const storeBills = new Set(ce.store.allocations.map(key));
  const missed = ce.model.allocations.filter((a) => !storeBills.has(key(a)));
  return {
    id: v.id,
    ops: ce.ops,
    model: ce.model,
    store: ce.store,
    missed,
    modelAllocated: sum(ce.model.allocations.map((a) => a.amount)),
    storeAllocated: sum(ce.store.allocations.map((a) => a.amount)),
  };
}

/* ------------------------------------------------------------------ rigour */

export function testCounts() {
  const t = evidence.tests();
  const n = (o: string) => t.filter((x) => x.outcome === o).length;
  return { passed: n("passed"), failed: n("failed"), skipped: n("skipped"), total: t.length };
}

/** Test cases counted by outcome per test file, with their total seconds. */
export function testsByFile() {
  const t = evidence.tests();
  return [...new Set(t.map((x) => x.file))].map((file) => {
    const mine = t.filter((x) => x.file === file);
    const n = (o: string) => mine.filter((x) => x.outcome === o).length;
    return { file, passed: n("passed"), failed: n("failed"), skipped: n("skipped"), seconds: sum(mine.map((x) => x.seconds)) };
  });
}

const SCOPES: Record<string, string> = {
  M: "Lean check pipeline",
  N: "Checks added later",
  R: "Vacuity guard: refutations",
  D: "Optimisation checker, ledger and load generator",
};

/** Each mutation's result, joined to the code change tools/mutate.py makes. */
export function mutationRows() {
  const defs = evidence.catalog().mutations;
  return evidence.mutations().rows.map((r) => {
    const d = defs.find((x) => x.mutation === r.mutation);
    const [code, ...rest] = r.mutation.split(" ");
    return {
      code,
      name: rest.join(" "),
      scope: SCOPES[code[0]] ?? "",
      bites: r.result === "BITES",
      result: r.result,
      summary: r.summary,
      file: d?.file ?? "",
      find: d?.find.trim() ?? "",
      replace: d?.replace.trim() ?? "",
      tests: d?.tests ?? "",
    };
  });
}

export function mutationCounts() {
  const rows = evidence.mutations().rows;
  return { bit: rows.filter((r) => r.result === "BITES").length, total: rows.length };
}

/* ------------------------------------------------------------------ proofs */

/** Each Lean claim's record, joined to its result from the checker. */
export function proofRows() {
  const results = evidence.prove();
  return evidence.catalog().lean_claims.map((c) => ({ ...c, result: results.find((r) => r.id === c.id) }));
}

export function proofCounts() {
  const p = evidence.prove();
  return { verified: p.filter((r) => r.accepted).length, total: p.length, lock: p[0]?.lock_sha256 ?? "", toolchain: p[0]?.toolchain ?? "" };
}

/* ------------------------------------------------------------------ findings */

export function findingCounts() {
  const f = evidence.findings().findings;
  const kinds = ["finding", "caught", "failure", "mistake"] as const;
  return kinds.map((kind) => ({ kind, count: f.filter((x) => x.kind === kind).length }));
}
