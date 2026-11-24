/**
 * The God's Hand part 2 evidence files, read as they are.
 *
 * The files live in `public/results/retroactive-ledger/`, copied byte for byte
 * from the repository's commit by `scripts/results/sync-retroactive-ledger.mjs`,
 * so readers can download exactly what this dashboard reads. They are read at
 * build time only (this module uses `node:fs`), and parsing does no arithmetic:
 * every computed figure lives in `derive.ts`.
 */
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(process.cwd(), "public", "results", "retroactive-ledger");
const VERDICTS = "evidence/part2/leancheck-2026-11-24-locked";
const PUBLISHED = "evidence/part2/published-2026-11-24";

/** Public URL of a hosted evidence file. */
export const rawUrl = (file: string) => `/results/retroactive-ledger/${file}`;

/** The proofs checked against the owner's lock, in the order they are shown. */
export const PROOFS = [
  "rebuildFromInsertExact",
  "rebuildFromRemoveExact",
  "forkSyncDisagreesWithRebuild",
  "forkSyncDisagreesWithRebuild_robust",
  "forkSyncDisagreesWithRebuild_tie",
  "rebuildIgnoresArrival",
  "paymentConserved",
] as const;
export type ProofName = (typeof PROOFS)[number];

/** Every hosted file, by the role it plays on the dashboard. */
export const FILES = {
  ...Object.fromEntries(PROOFS.map((p) => [`verdict_${p}`, `${VERDICTS}/${p}.json`])),
  context: `${VERDICTS}/context.txt`,
  lock: "part2/spec.lock.json",
  spec: "part2/Spec/Retro.lean",
  proofsSource: "part2/Proofs/Retro.lean",
  counterexamples: `${PUBLISHED}/counterexamples.json`,
  counterexamplesLean: `${PUBLISHED}/counterexamples.lean`,
  codeRepro: `${PUBLISHED}/code-reproduction.json`,
  optimisation: `${PUBLISHED}/optimisation.json`,
  javaExtract: `${PUBLISHED}/java-results-extract.txt`,
  makePublished: `${PUBLISHED}/make_published.py`,
  publishedReadme: `${PUBLISHED}/README.md`,
  haskell1118: "evidence/plp/repro-haskell-2026-11-18.txt",
  haskell1123: "evidence/part2/readings8-2026-11-23/code-check-original-haskell.txt",
  pretestLean: "evidence/part2/rebuild-from-earliest-2026-11-24/pretest.lean",
  pretest: "evidence/part2/rebuild-from-earliest-2026-11-24/pretest.out.txt",
  biteLean: "evidence/part2/rebuild-from-earliest-2026-11-24/bite.lean",
  bite: "evidence/part2/rebuild-from-earliest-2026-11-24/bite.out.txt",
  readings: "evidence/part2/mapping-2026-11-23/readings-needed.txt",
  mapping: "docs/part2/paper-model-mapping.md",
  speedNotes: "evidence/part2/speed-2026-11-24/NOTES.md",
  speedRun: "evidence/part2/speed-2026-11-24/run-full.out.txt",
  speedSummary: "evidence/part2/speed-2026-11-24/run-full.out.summary.json",
  speedSummaryText: "evidence/part2/speed-2026-11-24/run-full.out.summary.txt",
  summarise: "evidence/part2/speed-2026-11-24/summarise.py",
  probe: "evidence/part2/speed-2026-11-24/probe.out.txt",
  investigate: "evidence/part2/speed-2026-11-24/investigate.out.txt",
  modelFuelLean: "evidence/part2/speed-2026-11-24/model-fuel.lean",
  modelFuel: "evidence/part2/speed-2026-11-24/model-fuel.out.txt",
  javaFour: "evidence/part2/speed-2026-11-24/java-four-events-extract.txt",
  nontermination: "evidence/part2/speed-2026-11-24/nontermination.json",
  makeNontermination: "evidence/part2/speed-2026-11-24/make_published.py",
  bench: "tools/plp/haskell/Bench.hs",
} as Record<string, string>;

export type FileKey = keyof typeof FILES;

/* ------------------------------------------------------------------ shapes */

export interface Verdict {
  accepted: boolean;
  axioms: string[];
  lock_sha256: string;
  module: string;
  proof: string;
  proof_file_sha256: string;
  statement: string;
  toolchain: string;
  violations: { code: string; detail?: string }[];
  witness: string | null;
}

export interface Bal {
  fee: number;
  principal: number;
  excess: number;
}

export interface ModelState {
  balance: Bal;
  effects: { id: number; effect: Bal }[];
}

export interface ModelEvent {
  id: number;
  day: number;
  event: { kind: "disburse" | "charge" | "pay" | "reverse"; amount?: number; order?: string; target?: number };
}

export interface Counterexample {
  name: string;
  lean: string;
  arrivals: ModelEvent[];
  rebuild: ModelState;
  forkSync: ModelState;
  forkSyncStuck: boolean;
  adjustments: number;
  agree: boolean;
}

export interface CodeState {
  balance: Bal;
  effects: { id: string; effect: Bal }[];
  entries?: number;
}

export interface CodeCase {
  implementation: "Haskell port" | "Java service";
  case: string;
  file: string;
  lines?: number[];
  log_lines?: number[];
  from_log?: string;
  ids?: string;
  scenario?: string;
  arrival: CodeState;
  on_time: CodeState;
  late_path_agrees_with_on_time: boolean;
  balance_agrees: boolean;
}

export interface Counted {
  value: number;
  file: string;
  line: number;
  text: string;
}

export interface Optimisation {
  arrival_cases: Counted;
  arrival_backdated: Counted;
  arrival_claim_fails: Counted;
  reversal_cases: Counted;
  reversal_not_last: Counted;
  reversal_claim_fails: Counted;
  variants: { variant: string; fails_on: number; file: string; line: number; case: "arrival" | "reversal" }[];
}

export interface Source {
  repository: string;
  commit: string;
  checked_at: string;
  copied_from: string;
  copied_by: string;
  files: Record<string, string>;
}

export interface Lock {
  version: number;
  files: Record<string, string>;
}

/* ----------------------------------------------------------------- loading */

function bytes(file: string): Buffer {
  return readFileSync(join(ROOT, file));
}

function text(file: string): string {
  return bytes(file).toString("utf8");
}

function json<T>(file: string): T {
  return JSON.parse(text(file)) as T;
}

function once<T>(load: () => T): () => T {
  let value: T | undefined;
  let loaded = false;
  return () => {
    if (!loaded) {
      value = load();
      loaded = true;
    }
    return value as T;
  };
}

/** The commit the checked proofs came from, as `context.txt` records it. */
function parseContextCommit(raw: string): string {
  const m = raw.match(/commit ([0-9a-f]{7,40})/);
  if (!m) throw new Error("context.txt: no commit");
  return m[1];
}

/**
 * A spec definition's Lean source, with the doc comment above it, cut from
 * `Spec/Retro.lean` exactly as written.
 */
function parseDefinition(spec: string, name: string): string {
  const lines = spec.split(/\r?\n/);
  const start = lines.findIndex((l) => l.startsWith(`def ${name} `) || l.startsWith(`def ${name}:`));
  if (start < 0) throw new Error(`Spec/Retro.lean: no def ${name}`);
  let from = start;
  if (lines[start - 1]?.trimEnd().endsWith("-/")) {
    from = start - 1;
    while (from > 0 && !lines[from].startsWith("/--")) from--;
  }
  let to = start;
  while (to + 1 < lines.length && lines[to + 1].trim() !== "") to++;
  return lines.slice(from, to + 1).join("\n");
}

export const evidence = {
  verdict: (p: ProofName) => json<Verdict>(FILES[`verdict_${p}`]),
  counterexamples: once(() => json<{ source: string; cases: Counterexample[] }>(FILES.counterexamples)),
  codeRepro: once(() => json<{ about: string; cases: CodeCase[] }>(FILES.codeRepro)),
  optimisation: once(() => json<Optimisation>(FILES.optimisation)),
  source: once(() => json<Source>("source.json")),
  lock: once(() => json<Lock>(FILES.lock)),
  checkedCommit: once(() => parseContextCommit(text(FILES.context))),
  definition: (name: string) => parseDefinition(text(FILES.spec), name),
};

export function fingerprint(file: string): { sha256: string; bytes: number } {
  return {
    sha256: createHash("sha256").update(bytes(file)).digest("hex"),
    bytes: statSync(join(ROOT, file)).size,
  };
}

/* ------------------------------------------------------------ speed (2026-11-24) */

export interface EngineStats {
  rounds: number;
  timed_out: number;
  median_s: number | null;
  min_s: number | null;
  max_s: number | null;
  lines: number[];
}

export interface SpeedRow {
  config: string;
  engines: Record<"forkSync" | "full" | "partial", EngineStats>;
  partial_vs_full_ratio: number | null;
  call: string;
  forkSync_vs_full_ratio?: number;
}

export interface SpeedCheck {
  config: string;
  activities: number;
  reversals: number;
  backdated: number;
  partial_equals_full: boolean;
  forkSync_equals_full: boolean | string;
  line: number;
}

export interface SpeedSummary {
  source: string;
  checks: SpeedCheck[];
  rows: SpeedRow[];
  rule: string;
}

export interface SpeedEnv {
  hostKernel: string;
  ghc: string;
  cpu: string;
  cpus: string;
  startedAt: string;
  endedAt: string;
  benchSha256: string;
}

/** The environment lines `run-full.out.txt` starts and ends with, as written. */
function parseSpeedEnv(raw: string): SpeedEnv {
  const lines = raw.split(/\r?\n/).filter((l) => l.trim() !== "");
  const iso = lines.filter((l) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(l));
  const find = (re: RegExp) => {
    const l = lines.find((x) => re.test(x));
    if (!l) throw new Error(`run-full.out.txt: no line matching ${re}`);
    return l;
  };
  return {
    hostKernel: find(/^ENV_HOST /).replace(/^ENV_HOST /, ""),
    ghc: find(/Glasgow Haskell/).replace(/.*version /, "GHC "),
    cpu: find(/^model name/).replace(/^model name\s*:\s*/, ""),
    cpus: find(/^\d+$/),
    startedAt: iso[0],
    endedAt: iso[iso.length - 1],
    benchSha256: find(/^[0-9a-f]{64}\s/).split(/\s+/)[0],
  };
}

/** The expiry date the speed notes state ("Measurements expire YYYY-MM-DD"). */
function parseExpiry(raw: string): string {
  const m = raw.match(/expire (\d{4}-\d{2}-\d{2})/);
  if (!m) throw new Error("speed NOTES.md: no expiry");
  return m[1];
}

export interface NonTermination {
  about: string;
  events: { id: string; activity: string; effective: string; line: number }[];
  model: {
    file: string;
    fuel: { fuel: number; stuck: boolean }[];
    prefixes: { events: number; stuck: boolean }[];
    removals: { without: string; stuck_at_fuel_512: boolean; line: number }[];
  };
  haskell: {
    file: string;
    workloads: { config: string; runner: string; outcome: string; reversals: number; backdated: number; line: number }[];
    shrunk: { runner: string; activities: number; outcome: string; error?: string; line: number }[];
    retries: { runner: string; limit_seconds: number; outcome: string; error?: string; line: number }[];
  };
  java: { file: string; stack_overflow_lines: number[]; frames: { count: number; frame: string; line: number }[] };
}

export const speedEvidence = {
  summary: once(() => json<SpeedSummary>(FILES.speedSummary)),
  env: once(() => parseSpeedEnv(text(FILES.speedRun))),
  expires: once(() => parseExpiry(text(FILES.speedNotes))),
  nontermination: once(() => json<NonTermination>(FILES.nontermination)),
};
