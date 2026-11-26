/**
 * Every figure the HELIOS dashboard shows that isn't copied straight from a
 * file is computed here, by a named function, from the parsed evidence.
 */
import { ESTIMATORS, FILES, evidence, fingerprint, type Estimator, type SummaryRow } from "./evidence";

export type Metric = "rms_total_deg_mean" | "rms_cross_sun_deg_mean" | "rms_along_sun_deg_mean" | "final_total_deg_mean";

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Scenarios in the order the benchmark ran them. */
export function scenarios(): string[] {
  return [...new Set(evidence.summary().map((r) => r.scenario))];
}

function summaryRow(scenario: string, est: Estimator): SummaryRow {
  const row = evidence.summary().find((r) => r.scenario === scenario && r.estimator === est);
  if (!row) throw new Error(`summary.csv: no row for ${scenario}/${est}`);
  return row;
}

/** One summary metric for a scenario and estimator (mean over seeds). */
export function cell(scenario: string, est: Estimator, metric: Metric): number {
  return summaryRow(scenario, est)[metric];
}

/** The mean over all scenarios of one estimator's per-scenario mean. */
export function acrossScenarios(est: Estimator, metric: Metric): number {
  return mean(scenarios().map((s) => cell(s, est, metric)));
}

/** How many runs, seeds and scenarios the full benchmark covered, and whether every run stayed finite. */
export function runCounts() {
  const runs = evidence.runs();
  return {
    runs: runs.length,
    seeds: new Set(runs.map((r) => r.seed)).size,
    scenarios: scenarios().length,
    estimators: new Set(runs.map((r) => r.estimator)).size,
    allFinite: runs.every((r) => r.finite),
  };
}

/** Every seed's RMS total error for one scenario, per estimator, with the median. */
export function seedSpread(scenario: string) {
  return ESTIMATORS.map((est) => {
    const rows = evidence.runs().filter((r) => r.scenario === scenario && r.estimator === est);
    const values = rows.map((r) => r.rms_total_deg);
    return {
      estimator: est,
      points: rows.map((r) => ({ seed: r.seed, value: r.rms_total_deg })),
      median: median(values),
      min: Math.min(...values),
      max: Math.max(...values),
    };
  });
}

/** Memory each estimator keeps between steps, from the benchmark's own count. */
export function stateBytes(est: Estimator): number {
  const row = evidence.runs().find((r) => r.estimator === est);
  if (!row) throw new Error(`runs.csv: no rows for ${est}`);
  return row.state_bytes_f32;
}

/** Largest C-vs-Python attitude difference per estimator, in double and in float. */
export function embeddedWorst() {
  return ESTIMATORS.map((est) => {
    const rows = evidence.embedded().filter((r) => r.estimator === est);
    const worstF32 = rows.reduce((a, b) => (b.max_diff_vs_python_deg_f32 > a.max_diff_vs_python_deg_f32 ? b : a));
    return {
      estimator: est,
      f64: Math.max(...rows.map((r) => r.max_diff_vs_python_deg_f64)),
      f32: worstF32.max_diff_vs_python_deg_f32,
      f32Scenario: worstF32.scenario,
      rmsShiftF32: Math.max(...rows.map((r) => Math.abs(r.rms_total_deg_c_f32 - r.rms_total_deg_python))),
      scenarios: rows.length,
    };
  });
}

/** The single largest float difference from Python, over every estimator and scenario. */
export function embeddedWorstOverall() {
  return embeddedWorst().reduce((a, b) => (b.f32 > a.f32 ? b : a));
}

/** The Sun sensor's effect while sitting still: cross-Sun error falls, along-Sun error does not. */
export function sunBlindSpot(scenario = "static") {
  const gyro = summaryRow(scenario, "gyro_only");
  const sunOnly = (["complementary", "mahony_pi", "mekf"] as const).map((e) => summaryRow(scenario, e));
  const withGravity = summaryRow(scenario, "mekf_sun_gravity");
  return {
    scenario,
    gyroCross: gyro.rms_cross_sun_deg_mean,
    gyroAlong: gyro.rms_along_sun_deg_mean,
    sunOnlyCrossMax: Math.max(...sunOnly.map((r) => r.rms_cross_sun_deg_mean)),
    sunOnlyCrossMin: Math.min(...sunOnly.map((r) => r.rms_cross_sun_deg_mean)),
    sunOnlyAlongMin: Math.min(...sunOnly.map((r) => r.rms_along_sun_deg_mean)),
    sunOnlyAlongMax: Math.max(...sunOnly.map((r) => r.rms_along_sun_deg_mean)),
    gravityAlong: withGravity.rms_along_sun_deg_mean,
  };
}

/** The firmware benchmark's PC run: every estimator's line and whether all passed. */
export function benchFacts() {
  const b = evidence.bench();
  return { ...b, allPass: b.rows.length === ESTIMATORS.length && b.rows.every((r) => r.result === "PASS") };
}

/** Each hosted file, re-hashed at build time and compared with the hash recorded at copy time. */
export function hostedFiles() {
  const source = evidence.source();
  return Object.values(FILES).map((file) => {
    const now = fingerprint(file);
    return { file, ...now, copied: source.files[file], ok: source.files[file] === now.sha256 };
  });
}

/** The named computations, for the Method section. */
export const COMPUTATIONS = [
  ["acrossScenarios", "Mean over the 8 scenarios of an estimator's per-scenario mean (summary.csv)."],
  ["seedSpread", "Every seed's RMS total error for one scenario, with the median and range (runs.csv)."],
  ["sunBlindSpot", "Cross-Sun and along-Sun error while still, gyro only against the Sun-aided estimators (summary.csv)."],
  ["embeddedWorst", "Largest C-vs-Python attitude difference per estimator, double and float (embedded_vs_python.csv)."],
  ["benchFacts", "The firmware benchmark's result lines, and whether every estimator passed (bench_host.txt)."],
  ["hostedFiles", "SHA-256 of every hosted file at build time, against the hash recorded at copy time."],
] as const;
