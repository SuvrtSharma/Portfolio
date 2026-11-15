/**
 * The God's Hand evidence files, read as they are.
 *
 * The files live in `public/results/gods-hand/`, copied byte for byte by
 * `scripts/results/sync-gods-hand.mjs`, so readers can download exactly what
 * this dashboard reads. They are read at build time only (this module uses
 * `node:fs`), and parsing does no arithmetic: every computed figure lives in
 * `derive.ts`, where the Method tab can point at it.
 */
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export const RUN = "20261114T210922Z";
const ROOT = join(process.cwd(), "public", "results", "gods-hand");

/** Public URL of a hosted evidence file. */
export const rawUrl = (file: string) => `/results/gods-hand/${file}`;

/** Every hosted file, by the role it plays on the dashboard. */
export const FILES = {
  benchmark: `evidence/${RUN}/benchmark.json`,
  verdicts: `evidence/${RUN}/verdicts.json`,
  tests: `evidence/${RUN}/tests.xml`,
  manifest: `evidence/${RUN}/manifest.json`,
  prove: "evidence/prove-2026-11-15.json",
  mutations: "evidence/mutations-2026-11-15.json",
  catalog: "evidence/claims-catalog.json",
  findings: "evidence/findings.json",
  nagle: "evidence/nagle-experiment-2026-11-07.txt",
  fsync: "evidence/fsync-probe-2026-11-07.txt",
  run1: "evidence/20261107T090049Z/benchmark.json",
} as const;

export type EvidenceFile = (typeof FILES)[keyof typeof FILES];

/* ------------------------------------------------------------------ shapes */

export interface OpStats {
  requests: number;
  ok: number;
  errors: number;
  throughput_rps: number;
  p50_ms: number;
  p95_ms: number;
  p99_ms: number;
  max_ms: number;
}

export interface Rep {
  overall: OpStats;
  by_op: Record<string, OpStats>;
  status_counts: Record<string, number>;
  ok_per_second: number[];
  seconds: number;
  samples_file?: string;
  samples_sha256?: string;
}

export interface BenchRun {
  label: string;
  config_changes: Record<string, unknown>;
  reps: Rep[];
  warmup: { seconds: number; ok: number }[];
  sanity: { balance_p50_min_ms: number; floor_ms: number; ok: boolean };
}

export interface Benchmark {
  run_id: string;
  started_at: string;
  expires: string;
  git: { commit: string; dirty: boolean; dirty_files: string[] };
  environment: Record<string, unknown>;
  baseline_config: Record<string, unknown>;
  load: Record<string, number>;
  tests: { exit_code: number; summary: string };
  runs: BenchRun[];
  before_runs: BenchRun[];
  interleaved_order: string[][];
}

export interface Reason {
  code: string;
  detail: unknown;
}

export interface LeanResult {
  statement: string;
  proof: string;
  accepted: boolean;
  violations: string[];
  axioms: string[];
}

export interface Allocation {
  bill: number;
  payment: number;
  amount: number;
}

export interface PaymentAnswer {
  payment: number;
  advance: number;
  allocations: Allocation[];
}

export interface Verdict {
  id: string;
  title: string;
  kind: string;
  agent_says: string;
  config: Record<string, unknown>;
  declared_drops: string[];
  verdict: "accept" | "reject";
  reasons: Reason[];
  check_seconds: number;
  evidence: {
    observed: Record<
      "baseline" | "candidate",
      { pragmas: Record<string, string | number>; held: Record<string, boolean> }
    >;
    compensations?: LeanResult[];
    conformance: {
      config: Record<string, unknown>;
      sequences: number;
      operations: number;
      mismatches: number;
      seed: number;
      notes: string[];
      shrunk_counterexample?: {
        ops: Record<string, string | number>[];
        index: number;
        model: PaymentAnswer;
        store: PaymentAnswer;
      };
    };
  };
}

export interface Verdicts {
  generated_at: string;
  environment: Record<string, unknown>;
  spec_locked: boolean;
  seconds: number;
  profile_baseline: string;
  verdicts: Verdict[];
}

export interface ProveRow {
  id: string;
  accepted: boolean;
  seconds: number;
  axioms: string[];
  lock_sha256: string;
  module: string;
  proof: string;
  statement: string;
  toolchain: string;
  violations: { code: string }[];
  witness?: string | null;
  replayed_modules: string[];
  replay_reused: string[];
}

export interface Catalog {
  git_commit: string;
  sources: Record<string, string>;
  lean_claims: {
    id: string;
    kind: string;
    says: string;
    statement: string;
    proof: string;
    doc: string;
    lean: string;
    spec_lines: [number, number];
    file: string;
  }[];
  optimisations: {
    id: string;
    kind: string;
    title: string;
    agent_says: string;
    drops: string[];
    compensated_by: { rule: string; statement: string; lean: string }[];
    refuted_by: { statement: string; proof: string } | "";
    file: string;
  }[];
  mutations: { mutation: string; file: string; find: string; replace: string; tests: string }[];
}

export interface Finding {
  id: string;
  date: string;
  kind: "finding" | "failure" | "mistake" | "caught";
  title: string;
  expected: string;
  observed: string;
  impact: string;
  evidence: string[];
}

export interface TestCase {
  file: string;
  name: string;
  seconds: number;
  outcome: "passed" | "failed" | "skipped";
  message: string;
}

export interface NagleTrial {
  mode: "Nagle on" | "TCP_NODELAY";
  trial: number;
  rps: number;
  p50_ms: number;
  balance_p50_ms: number;
  open_p50_ms: number;
  payment_p50_ms: number;
}

export interface FsyncTrial {
  fsyncs: number;
  p50_ms: number;
  p99_ms: number;
  p99_9_ms: number;
  max_ms: number;
  per_second: number[];
}

export interface Source {
  commit: string;
  uncommitted_changes: string[];
  run: string;
  copied_by: string;
  files: Record<string, string>;
}

/* ------------------------------------------------------------------ reading */

function bytes(file: string): Buffer {
  return readFileSync(join(ROOT, file));
}

function text(file: string): string {
  return bytes(file).toString("utf8").replace(/^﻿/, "");
}

function json<T>(file: string): T {
  return JSON.parse(text(file)) as T;
}

/** Read once per build process; every page of the dashboard shares it. */
function once<T>(load: () => T): () => T {
  let value: T | undefined;
  return () => (value ??= load());
}

const XML_ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
const unescapeXml = (s: string) => s.replace(/&(amp|lt|gt|quot|apos);/g, (_, e: string) => XML_ENTITIES[e]);
const attr = (tag: string, name: string) => {
  const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`));
  return m ? unescapeXml(m[1]) : "";
};

/** pytest's JUnit report: one entry per `<testcase>`, in file order. */
function parseJUnit(xml: string): TestCase[] {
  const cases: TestCase[] = [];
  const re = /<testcase\b([^>]*?)(\/>|>([\s\S]*?)<\/testcase>)/g;
  for (const m of xml.matchAll(re)) {
    const head = `<testcase${m[1]}>`;
    const body = m[3] ?? "";
    const bad = body.match(/<(failure|error)\b[^>]*/);
    const skip = body.match(/<skipped\b[^>]*/);
    cases.push({
      file: attr(head, "classname"),
      name: attr(head, "name"),
      seconds: Number(attr(head, "time")),
      outcome: bad ? "failed" : skip ? "skipped" : "passed",
      message: bad ? attr(bad[0], "message") : skip ? attr(skip[0], "message") : "",
    });
  }
  return cases;
}

/** The experiment printed one line per trial; this is its only record. */
function parseNagle(raw: string): NagleTrial[] {
  const re = /^(\S+) trial (\d+) rps ([\d.]+) p50 ([\d.]+) \| balance p50 ([\d.]+) open p50 ([\d.]+) payment p50 ([\d.]+)/;
  return raw
    .split(/\r?\n/)
    .map((line) => line.match(re))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => ({
      mode: m[1] === "nodelay" ? "TCP_NODELAY" : "Nagle on",
      trial: Number(m[2]),
      rps: Number(m[3]),
      p50_ms: Number(m[4]),
      balance_p50_ms: Number(m[5]),
      open_p50_ms: Number(m[6]),
      payment_p50_ms: Number(m[7]),
    }));
}

export const evidence = {
  benchmark: once(() => json<Benchmark>(FILES.benchmark)),
  verdicts: once(() => json<Verdicts>(FILES.verdicts)),
  tests: once(() => parseJUnit(text(FILES.tests))),
  manifest: once(() => json<{ run_id: string; git: Benchmark["git"]; files: Record<string, string> }>(FILES.manifest)),
  prove: once(() => json<ProveRow[]>(FILES.prove)),
  mutations: once(() => json<{ rows: { mutation: string; result: string; summary: string }[]; restored: boolean }>(FILES.mutations)),
  catalog: once(() => json<Catalog>(FILES.catalog)),
  findings: once(() => json<{ about: string; findings: Finding[] }>(FILES.findings)),
  nagle: once(() => parseNagle(text(FILES.nagle))),
  fsync: once(() => text(FILES.fsync).split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l) as FsyncTrial)),
  run1: once(() => json<Benchmark>(FILES.run1)),
  source: once(() => json<Source>("source.json")),
};

/** SHA-256 and size of a hosted copy, computed now, at build time. */
export function fingerprint(file: string): { sha256: string; bytes: number } {
  return {
    sha256: createHash("sha256").update(bytes(file)).digest("hex"),
    bytes: statSync(join(ROOT, file)).size,
  };
}
