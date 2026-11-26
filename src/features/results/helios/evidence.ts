/**
 * The HELIOS evidence files, read as they are.
 *
 * The files live in `public/results/helios/`, copied byte for byte from the
 * repository's commit by `scripts/results/sync-helios.mjs`, so readers can
 * download exactly what this dashboard reads. They are read at build time only
 * (this module uses `node:fs`), and parsing does no arithmetic: every computed
 * figure lives in `derive.ts`.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(process.cwd(), "public", "results", "helios");

/** Public URL of a hosted evidence file. */
export const rawUrl = (file: string) => `/results/helios/${file}`;

/** Every hosted file, by the role it plays on the dashboard. */
export const FILES = {
  readme: "README.md",
  runs: "phase1/runs.csv",
  summary: "phase1/summary.csv",
  metadata: "phase1/metadata.json",
  runLog: "run_phase1.log",
  embedded: "embedded_vs_python.csv",
  embeddedLog: "compare_embedded.log",
  bench: "bench_host.txt",
  tests: "tests.txt",
  esp32: "esp32-build.txt",
} as const;

export type FileKey = keyof typeof FILES;

/** Estimators in the order the project lists them, simplest first. */
export const ESTIMATORS = ["gyro_only", "complementary", "mahony_pi", "mekf", "mekf_sun_gravity"] as const;
export type Estimator = (typeof ESTIMATORS)[number];

/* ------------------------------------------------------------------ shapes */

export interface RunRow {
  scenario: string;
  seed: number;
  estimator: Estimator;
  rms_total_deg: number;
  rms_cross_sun_deg: number;
  rms_along_sun_deg: number;
  final_total_deg: number;
  max_total_deg: number;
  us_per_step_python: number;
  state_floats: number;
  state_bytes_f32: number;
  finite: boolean;
  min_cov_eig: number;
  sun_valid_fraction: number;
}

export interface SummaryRow {
  scenario: string;
  estimator: Estimator;
  n_seeds: number;
  state_bytes_f32: number;
  rms_total_deg_mean: number;
  rms_total_deg_std: number;
  rms_cross_sun_deg_mean: number;
  rms_cross_sun_deg_std: number;
  rms_along_sun_deg_mean: number;
  rms_along_sun_deg_std: number;
  final_total_deg_mean: number;
  final_total_deg_std: number;
  us_per_step_python_mean: number;
  us_per_step_python_std: number;
  all_finite: boolean;
}

export interface EmbeddedRow {
  scenario: string;
  seed: number;
  estimator: Estimator;
  samples: number;
  rms_total_deg_python: number;
  max_diff_vs_python_deg_f64: number;
  rms_total_deg_c_f64: number;
  max_diff_vs_python_deg_f32: number;
  rms_total_deg_c_f32: number;
}

/** One `HELIOS_BENCH` line of the firmware benchmark, as printed. */
export interface BenchRow {
  estimator: Estimator;
  struct_bytes: number;
  samples: number;
  mean_us: number;
  max_us: number;
  max_err_deg: number;
  result: "PASS" | "FAIL";
}

export interface Metadata {
  generated_utc: string;
  seeds: number[];
  quick: boolean;
  python: string;
  numpy: string;
  machine: string;
  note: string;
}

export interface Source {
  repository: string;
  run: string;
  commit: string;
  committed_at: string;
  copied_from: string;
  copied_by: string;
  files: Record<string, string>;
}

/* ----------------------------------------------------------------- loading */

function bytes(file: string): Buffer {
  return readFileSync(join(ROOT, file));
}

function text(file: string): string {
  return bytes(file).toString("utf8");
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

/** A CSV with a header row and no quoted fields, as the benchmark writes it. */
function csv(file: string): Record<string, string>[] {
  const lines = text(file).split(/\r?\n/).filter((l) => l.length > 0);
  const header = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    if (cells.length !== header.length) throw new Error(`${file}: row has ${cells.length} cells, header ${header.length}`);
    return Object.fromEntries(header.map((h, i) => [h, cells[i]]));
  });
}

/** Python writes NaN as "nan" and booleans as "True"/"False". */
const num = (s: string) => (s === "nan" ? Number.NaN : Number(s));
const bool = (s: string) => s === "True";

function estimator(s: string): Estimator {
  if (!(ESTIMATORS as readonly string[]).includes(s)) throw new Error(`unknown estimator ${s}`);
  return s as Estimator;
}

function parseRuns(): RunRow[] {
  return csv(FILES.runs).map((r) => ({
    scenario: r.scenario,
    seed: num(r.seed),
    estimator: estimator(r.estimator),
    rms_total_deg: num(r.rms_total_deg),
    rms_cross_sun_deg: num(r.rms_cross_sun_deg),
    rms_along_sun_deg: num(r.rms_along_sun_deg),
    final_total_deg: num(r.final_total_deg),
    max_total_deg: num(r.max_total_deg),
    us_per_step_python: num(r.us_per_step_python),
    state_floats: num(r.state_floats),
    state_bytes_f32: num(r.state_bytes_f32),
    finite: bool(r.finite),
    min_cov_eig: num(r.min_cov_eig),
    sun_valid_fraction: num(r.sun_valid_fraction),
  }));
}

function parseSummary(): SummaryRow[] {
  return csv(FILES.summary).map((r) => ({
    scenario: r.scenario,
    estimator: estimator(r.estimator),
    n_seeds: num(r.n_seeds),
    state_bytes_f32: num(r.state_bytes_f32),
    rms_total_deg_mean: num(r.rms_total_deg_mean),
    rms_total_deg_std: num(r.rms_total_deg_std),
    rms_cross_sun_deg_mean: num(r.rms_cross_sun_deg_mean),
    rms_cross_sun_deg_std: num(r.rms_cross_sun_deg_std),
    rms_along_sun_deg_mean: num(r.rms_along_sun_deg_mean),
    rms_along_sun_deg_std: num(r.rms_along_sun_deg_std),
    final_total_deg_mean: num(r.final_total_deg_mean),
    final_total_deg_std: num(r.final_total_deg_std),
    us_per_step_python_mean: num(r.us_per_step_python_mean),
    us_per_step_python_std: num(r.us_per_step_python_std),
    all_finite: bool(r.all_finite),
  }));
}

function parseEmbedded(): EmbeddedRow[] {
  return csv(FILES.embedded).map((r) => ({
    scenario: r.scenario,
    seed: num(r.seed),
    estimator: estimator(r.estimator),
    samples: num(r.samples),
    rms_total_deg_python: num(r.rms_total_deg_python),
    max_diff_vs_python_deg_f64: num(r.max_diff_vs_python_deg_f64),
    rms_total_deg_c_f64: num(r.rms_total_deg_c_f64),
    max_diff_vs_python_deg_f32: num(r.max_diff_vs_python_deg_f32),
    rms_total_deg_c_f32: num(r.rms_total_deg_c_f32),
  }));
}

function parseBench(): { vector: string; rows: BenchRow[]; done: string } {
  const lines = text(FILES.bench).split(/\r?\n/);
  const vector = lines.find((l) => l.startsWith("HELIOS_VECTOR,")) ?? "";
  const done = lines.find((l) => l.startsWith("HELIOS_DONE,")) ?? "";
  const rows = lines
    .filter((l) => l.startsWith("HELIOS_BENCH,") && !l.startsWith("HELIOS_BENCH,estimator,"))
    .map((l) => {
      const [, name, structBytes, samples, mean, max, err, result] = l.split(",");
      return {
        estimator: estimator(name),
        struct_bytes: num(structBytes),
        samples: num(samples),
        mean_us: num(mean),
        max_us: num(max),
        max_err_deg: num(err),
        result: result === "PASS" ? "PASS" : "FAIL",
      } satisfies BenchRow;
    });
  return { vector, rows, done };
}

/** The last pytest summary line, e.g. "70 passed in 30.06s". */
function parseTests(): { passed: number; failed: number; skipped: number; line: string } {
  const line = text(FILES.tests)
    .split(/\r?\n/)
    .filter((l) => /\d+ (passed|failed)/.test(l))
    .pop();
  if (!line) throw new Error("tests.txt: no pytest summary line");
  const count = (word: string) => Number(line.match(new RegExp(`(\\d+) ${word}`))?.[1] ?? 0);
  return { passed: count("passed"), failed: count("failed"), skipped: count("skipped"), line: line.trim() };
}

/** Lines of the ESP32 build record, keyed by the label before the first colon. */
function parseEsp32(): Record<string, string> {
  return Object.fromEntries(
    text(FILES.esp32)
      .split(/\r?\n/)
      .filter((l) => l.includes(": "))
      .map((l) => [l.slice(0, l.indexOf(": ")).trim(), l.slice(l.indexOf(": ") + 2).trim()]),
  );
}

export const evidence = {
  runs: once(parseRuns),
  summary: once(parseSummary),
  embedded: once(parseEmbedded),
  bench: once(parseBench),
  tests: once(parseTests),
  esp32: once(parseEsp32),
  metadata: once(() => JSON.parse(text(FILES.metadata)) as Metadata),
  source: once(() => JSON.parse(text("source.json")) as Source),
};

export function fingerprint(file: string): { sha256: string; bytes: number } {
  const b = bytes(file);
  return { sha256: createHash("sha256").update(b).digest("hex"), bytes: b.length };
}
