/**
 * Every figure the part 2 dashboard computes, in one place. Inputs come from
 * `evidence.ts`, which only reads files; nothing here is typed in by hand
 * except the plain-language description of each claim.
 */
import { evidence, fingerprint, FILES, PROOFS, speedEvidence, type CodeCase, type ProofName, type SpeedRow, type Verdict } from "./evidence";

export type ClaimGroup = "optimisation" | "refutation" | "property";

/** What each checked proof says, in words. Interpretation, not figures. */
export const CLAIMS: Record<ProofName, { group: ClaimGroup; title: string; plain: string; statement: string }> = {
  rebuildFromInsertExact: {
    group: "optimisation",
    title: "Rebuild from the earliest affected point: an arrival",
    plain:
      "When an event arrives, keeping everything before its place in business order and re-applying only what follows gives exactly the full rebuild.",
    statement: "rebuildFromInsertExact",
  },
  rebuildFromRemoveExact: {
    group: "optimisation",
    title: "Rebuild from the earliest affected point: a reversal",
    plain:
      "When an event is reversed, keeping everything before it and re-applying only what follows gives exactly the full rebuild.",
    statement: "rebuildFromRemoveExact",
  },
  forkSyncDisagreesWithRebuild: {
    group: "refutation",
    title: "Fork-and-sync is not a full rebuild: the backdated case",
    plain: "Three events, no reversal, no adjustment: the modelled fork-and-sync allocates the payment differently.",
    statement: "forkSyncDisagreesWithRebuild",
  },
  forkSyncDisagreesWithRebuild_robust: {
    group: "refutation",
    title: "Fork-and-sync is not a full rebuild: the reading-robust case",
    plain:
      "Holds whichever way a fork's stored balances are read; the modelled fork-and-sync collects a fee twice.",
    statement: "forkSyncDisagreesWithRebuild",
  },
  forkSyncDisagreesWithRebuild_tie: {
    group: "refutation",
    title: "Fork-and-sync is not a full rebuild: a same-date tie",
    plain:
      "Disagrees only with our tie rule (same-date events ordered by id). The paper orders ties by arrival and promises nothing else.",
    statement: "forkSyncDisagreesWithRebuild",
  },
  rebuildIgnoresArrival: {
    group: "property",
    title: "The rebuild ignores arrival order",
    plain:
      "Two arrival orders of the same accepted events give the same balance and the same effect for every event.",
    statement: "rebuildIgnoresArrival",
  },
  paymentConserved: {
    group: "property",
    title: "Payments are allocated within limits",
    plain:
      "A payment pays in its stated order, never more than is owed, and only what is left over becomes excess.",
    statement: "paymentConserved",
  },
};

export interface ProofResult {
  name: ProofName;
  verdict: Verdict;
  group: ClaimGroup;
  title: string;
  plain: string;
  statement: string;
}

export function proofResults(): ProofResult[] {
  return PROOFS.map((name) => ({ name, verdict: evidence.verdict(name), ...CLAIMS[name] }));
}

export function proofCounts() {
  const all = proofResults();
  const by = (g: ClaimGroup) => all.filter((p) => p.group === g);
  const acc = (ps: ProofResult[]) => ps.filter((p) => p.verdict.accepted).length;
  return {
    total: all.length,
    accepted: acc(all),
    refutations: by("refutation").length,
    refutationsAccepted: acc(by("refutation")),
    optimisation: by("optimisation").length,
    optimisationAccepted: acc(by("optimisation")),
  };
}

/** The distinct spec statements the proofs establish, in order. */
export function statements(): string[] {
  return [...new Set(proofResults().map((p) => p.statement))];
}

export function optimisationTotals() {
  const o = evidence.optimisation();
  return {
    tested: o.arrival_cases.value + o.reversal_cases.value,
    failures: o.arrival_claim_fails.value + o.reversal_claim_fails.value,
    variants: o.variants.length,
    caught: o.variants.filter((v) => v.fails_on > 0).length,
    casesFor: (c: "arrival" | "reversal") => (c === "arrival" ? o.arrival_cases.value : o.reversal_cases.value),
  };
}

/**
 * Arrival position (1, 2, 3) of an effect id in a code run, so code and model
 * line up. The harnesses name events differently: the 2026-11-18 Haskell run
 * by arrival position from 0 ("0", "1", "2"), the Java runs by letter in
 * arrival order ("a", "b", "c"), the 2026-11-23 Haskell run by the model's ids.
 * Each record's `ids` field says which.
 */
export function arrivalPosition(c: CodeCase, id: string): number {
  if (/^[a-z]$/.test(id)) return id.charCodeAt(0) - "a".charCodeAt(0) + 1;
  if (c.ids?.startsWith("arrival positions")) return Number(id) + 1;
  return Number(id);
}

export function codeCases(name: string): CodeCase[] {
  return evidence.codeRepro().cases.filter((c) => c.case === name);
}

/** The chain from the hosted spec to the verdicts, checked at build time. */
export function chainChecks() {
  const lock = evidence.lock();
  const specNow = fingerprint(FILES.spec).sha256;
  const lockNow = fingerprint(FILES.lock).sha256;
  const verdicts = proofResults().map((p) => p.verdict);
  return {
    specNow,
    specInLock: lock.files["Spec/Retro.lean"],
    specMatchesLock: specNow === lock.files["Spec/Retro.lean"],
    lockNow,
    lockMatchesVerdicts: verdicts.every((v) => v.lock_sha256 === lockNow),
    proofFile: verdicts[0]?.proof_file_sha256 ?? "",
    oneProofFile: verdicts.every((v) => v.proof_file_sha256 === verdicts[0]?.proof_file_sha256),
    proofsNow: fingerprint(FILES.proofsSource).sha256,
    proofsMatchVerdicts: verdicts.every((v) => v.proof_file_sha256 === fingerprint(FILES.proofsSource).sha256),
  };
}

/** Every hosted file, re-hashed now and compared with the hash recorded at copy time. */
export function hostedFiles() {
  const source = evidence.source();
  return Object.values(FILES).map((file) => {
    const now = fingerprint(file);
    return { file, ...now, copied: source.files[file], ok: source.files[file] === now.sha256 };
  });
}

/** What a borrower owes on balance: fee + principal − excess. */
export const net = (b: { fee: number; principal: number; excess: number }) => b.fee + b.principal - b.excess;

/** Per counterexample: do the model's two answers differ, and does their net position agree? */
export function counterexampleFacts() {
  return evidence.counterexamples().cases.map((c) => ({
    name: c.name,
    differs: !c.agree,
    netAgrees: net(c.rebuild.balance) === net(c.forkSync.balance),
    adjustments: c.adjustments,
  }));
}

/** Per code run: does the late path disagree with on time, and does its balance match the model's fork-and-sync? */
export function reproductionFacts() {
  const model = evidence.counterexamples().cases;
  return evidence.codeRepro().cases.map((c) => {
    const m = model.find((x) => x.name === c.case);
    const same = (a: { fee: number; principal: number; excess: number }, b?: { fee: number; principal: number; excess: number }) =>
      b !== undefined && a.fee === b.fee && a.principal === b.principal && a.excess === b.excess;
    return {
      case: c.case,
      implementation: c.implementation,
      disagrees: !c.late_path_agrees_with_on_time,
      balanceAgrees: c.balance_agrees,
      lateBalanceMatchesModel: same(c.arrival.balance, m?.forkSync.balance),
    };
  });
}

/* ------------------------------------------------------------ speed (2026-11-24) */

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** A workload's settings, read back from its name ("n=800 late=0.50 Deep rev=0.05"). */
export function workloadParts(config: string) {
  const m = config.match(/^n=(\d+) late=([\d.]+) (Recent|Deep) rev=([\d.]+)$/);
  if (!m) throw new Error(`unexpected workload name: ${config}`);
  return { n: Number(m[1]), late: Number(m[2]), regime: m[3] as "Recent" | "Deep", reversals: Number(m[4]) };
}

export function speedStats() {
  const s = speedEvidence.summary();
  const rows = s.rows;
  const checks = s.checks;
  const ratios = rows.map((r) => r.partial_vs_full_ratio).filter((x): x is number => x !== null);
  const byRev = (rev: boolean) => rows.filter((r) => workloadParts(r.config).reversals > 0 === rev);
  const finished = (r: SpeedRow) => r.engines.forkSync.median_s !== null;
  const checkFor = (r: SpeedRow) => checks.find((c) => c.config === r.config);
  const forkGroup = (rev: boolean) => {
    const sel = byRev(rev);
    const fin = sel.filter(finished);
    return {
      workloads: sel.length,
      finished: fin.length,
      equalsFull: sel.filter((r) => checkFor(r)?.forkSync_equals_full === true).length,
      partialFasterThanFork: fin.filter((r) => (r.engines.partial.median_s ?? Infinity) < (r.engines.forkSync.median_s ?? 0)).length,
      forkFasterThanFull: fin.filter((r) => (r.engines.forkSync.median_s ?? Infinity) < (r.engines.full.median_s ?? 0)).length,
    };
  };
  const notFinished = checks.filter((c) => typeof c.forkSync_equals_full === "string");
  const regimeMedian = (reg: "Recent" | "Deep") =>
    median(rows.filter((r) => workloadParts(r.config).regime === reg).map((r) => r.partial_vs_full_ratio ?? 0));
  return {
    workloads: rows.length,
    faster: rows.filter((r) => r.call === "faster").length,
    partialEqualsFull: checks.filter((c) => c.partial_equals_full === true).length,
    ratioMin: Math.min(...ratios),
    ratioMax: Math.max(...ratios),
    ratioMedian: median(ratios),
    recentMedian: regimeMedian("Recent"),
    deepMedian: regimeMedian("Deep"),
    noReversals: forkGroup(false),
    withReversals: forkGroup(true),
    heapOverflow: notFinished.filter((c) => String(c.forkSync_equals_full).includes("heap overflow")).length,
    timeLimit: notFinished.filter((c) => String(c.forkSync_equals_full).includes("time limit")).length,
    sizes: [...new Set(rows.map((r) => workloadParts(r.config).n))],
  };
}

/** What the four-event case shows, in each of the three places it was run. */
export function nonTerminationFacts() {
  const d = speedEvidence.nontermination();
  const fuel = d.model.fuel;
  return {
    events: d.events.length,
    modelStuckAtEveryBound: fuel.length > 0 && fuel.every((f) => f.stuck),
    fuelMin: Math.min(...fuel.map((f) => f.fuel)),
    fuelMax: Math.max(...fuel.map((f) => f.fuel)),
    prefixesFinish: d.model.prefixes.filter((p) => p.events < d.events.length).every((p) => !p.stuck),
    eachIngredientNeeded: d.model.removals.length > 0 && d.model.removals.every((r) => !r.stuck_at_fuel_512),
    haskellBothPatterns: d.haskell.shrunk.length >= 2 && d.haskell.shrunk.every((s) => s.outcome !== "finished"),
    haskellRetryLimits: d.haskell.retries.map((r) => r.limit_seconds),
    haskellRetriesFail: d.haskell.retries.every((r) => r.outcome !== "finished"),
    javaStackOverflow: d.java.stack_overflow_lines.length > 0,
    // Each method's most repeated frame is the one inside the loop (the same method can also appear once or
    // twice at other lines, outside it); the cycle repeats as often as the less frequent of the two.
    javaCycleCount: Math.min(
      ...["performBackdatedActivity", "reverseLedgerActivity"].map((m) =>
        Math.max(0, ...d.java.frames.filter((f) => f.frame.includes(`.${m}(`)).map((f) => f.count)),
      ),
    ),
  };
}
