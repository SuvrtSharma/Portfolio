import { Card, DataTable, Td, Th, ViewSection } from "../../ui";
import { FILES, rawUrl } from "../evidence";

type Row = { figure: string; where: string; command: string; file: keyof typeof FILES; field: string; shown: string };

const ROWS: Row[] = [
  { figure: "Requests, errors, req/s, p50 to max, per round", where: "Speed", command: "python3 bench/docker_run.py after --each", file: "benchmark", field: "runs[].reps[].overall", shown: "As recorded" },
  { figure: "Median req/s, × baseline, speed result", where: "Overview, Speed", command: "same run", file: "benchmark", field: "runs[].reps[].overall.throughput_rps", shown: "configSummaries" },
  { figure: "Latency and req/s per operation", where: "Speed", command: "same run", file: "benchmark", field: "runs[].reps[].by_op", shown: "As recorded" },
  { figure: "p99 latency by operation", where: "Speed", command: "same run", file: "benchmark", field: "runs[].reps[].by_op[].p99_ms", shown: "p99ByOperation" },
  { figure: "Operation mix", where: "Speed", command: "same run", file: "benchmark", field: "runs[].reps[].by_op[].ok", shown: "observedMix" },
  { figure: "Requests per second, per second", where: "Speed", command: "same run", file: "benchmark", field: "runs[].reps[].ok_per_second", shown: "As recorded" },
  { figure: "Round order, load settings", where: "Speed", command: "same run", file: "benchmark", field: "interleaved_order, load, environment", shown: "As recorded" },
  { figure: "Warm-up and sanity check", where: "Speed", command: "same run", file: "benchmark", field: "runs[].warmup, runs[].sanity", shown: "As recorded" },
  { figure: "Requests and failed requests in total", where: "Overview", command: "same run", file: "benchmark", field: "runs[].reps[].overall.requests, .errors", shown: "requestTotals" },
  { figure: "fsync rate of the disk", where: "Speed", command: "bench/fsync_probe.py, run twice on 2026-11-07", file: "fsync", field: "one JSON object per probe", shown: "As recorded" },
  { figure: "Nagle experiment", where: "Speed", command: "A one-off experiment on 2026-11-07. Only its printed output was kept; the script isn't in the repository.", file: "nagle", field: "one line per trial", shown: "Parsed line by line" },
  { figure: "Run 1 balance p50", where: "Speed", command: "the first, native runner (run marked invalid)", file: "run1", field: "runs[baseline].reps[].by_op.balance.p50_ms", shown: "As recorded" },
  { figure: "Baseline profile", where: "Speed", command: "python3 bench/docker_run.py check", file: "verdicts", field: "profile_baseline", shown: "As recorded" },
  { figure: "Verdicts, reasons, observed settings, conformance", where: "Meaning verdicts", command: "python3 bench/docker_run.py check", file: "verdicts", field: "verdicts[]", shown: "As recorded" },
  { figure: "Optimisation claims accepted", where: "Overview, Meaning verdicts", command: "same run", file: "verdicts", field: "verdicts[].verdict", shown: "verdictCounts" },
  { figure: "Counterexample comparison", where: "Meaning verdicts", command: "same run", file: "verdicts", field: "…conformance.shrunk_counterexample", shown: "counterexampleComparison" },
  { figure: "Lean claims through every check", where: "Proofs", command: "python -m godshand prove --out, in the checker container", file: "prove", field: "[]", shown: "As recorded; proofCounts counts them" },
  { figure: "Claim texts and Lean statements", where: "Proofs, Meaning verdicts", command: "python tools/claims_catalog.py --out evidence/claims-catalog.json", file: "catalog", field: "lean_claims[], optimisations[]", shown: "Quoted verbatim; a test checks each quote against the spec" },
  { figure: "Mutation results", where: "Rigour", command: "python tools/mutate.py --out, in the checker container", file: "mutations", field: "rows[]", shown: "As recorded; mutationCounts counts them" },
  { figure: "What each mutation changes", where: "Rigour, Proofs", command: "python tools/claims_catalog.py (copies tools/mutate.py's list)", file: "catalog", field: "mutations[]", shown: "mutationRows joins it to the results" },
  { figure: "Test results", where: "Rigour", command: "python3 bench/docker_run.py before (pytest --junitxml)", file: "tests", field: "<testcase> elements", shown: "As recorded; testCounts and testsByFile count them" },
  { figure: "Findings", where: "Findings", command: "Written by hand by the agent and the owner, as each thing was learned", file: "findings", field: "findings[]", shown: "As recorded" },
  { figure: "Run id, commit, environment, expiry", where: "Header, Provenance", command: "python3 bench/docker_run.py", file: "benchmark", field: "run_id, git, environment, expires", shown: "As recorded" },
  { figure: "Evidence fingerprints", where: "Provenance", command: "docker_run.py writes the manifest; this site re-hashes its copies when it is built", file: "manifest", field: "files", shown: "Compared at build time" },
];

const CALCS = [
  ["configSummaries", "For each configuration: the median of its rounds' throughput, that median over the baseline's median, and the speed result. Faster only if its slowest round beat the baseline's fastest round; slower only if its fastest round lost to the baseline's slowest; otherwise inside the noise."],
  ["median", "The middle value of the sorted rounds, or the mean of the middle two when there's an even number of them."],
  ["p99ByOperation", "For each configuration and operation, the median over the rounds of each round's p99."],
  ["observedMix", "Successful requests per operation, summed over every configuration and round, as a share of all successful requests."],
  ["requestTotals", "Requests and failed requests summed over every configuration and round."],
  ["counterexampleComparison", "Counts the allocations the spec and the store returned for the last operation, sums their amounts, and lists the bills the spec paid that the store didn't."],
  ["verdictCounts, proofCounts, mutationCounts, testCounts, testsByFile", "Counts of accepted claims, verified proofs, mutations that bit, and test outcomes, overall and per test file."],
] as const;

export function MethodView() {
  return (
    <div className="space-y-14">
      <ViewSection
        id="how"
        title="How each number was made"
        intro={
          <div className="space-y-3">
            <p>
              Every figure on this dashboard starts as a file a command wrote during the run. The site reads those
              files when it is built, and shows each value either as recorded or through one of the named
              calculations below. Nothing is typed in by hand except the findings log, which says so. The commands
              are the ones in the project&apos;s runbook, run by the owner from a clean checkout.
            </p>
            <p>
              Latency percentiles are nearest rank over every successful request: the value at position
              ⌈n × q / 100⌉ of the sorted latencies, computed by the load generator, not here.
            </p>
          </div>
        }
      >
        <Card bodyClassName="p-0 sm:p-0">
          <DataTable caption="Each figure, its command, raw file and field">
            <thead>
              <tr>
                <Th>Figure</Th>
                <Th>Shown on</Th>
                <Th>Produced by</Th>
                <Th>Raw file and field</Th>
                <Th>How it&apos;s shown</Th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.figure}>
                  <Td className="min-w-48 font-medium text-foreground">{r.figure}</Td>
                  <Td className="min-w-28 text-muted-foreground">{r.where}</Td>
                  <Td mono className="min-w-64 text-xs">{r.command}</Td>
                  <Td className="min-w-56">
                    <a href={rawUrl(FILES[r.file])} className="font-mono text-xs text-gold underline decoration-gold/30 underline-offset-2 hover:decoration-gold">
                      {FILES[r.file]}
                    </a>
                    <span className="mt-0.5 block font-mono text-xs text-muted-foreground">{r.field}</span>
                  </Td>
                  <Td className="min-w-40 text-xs">
                    {r.shown.startsWith("As recorded") || r.shown.startsWith("Parsed") || r.shown.startsWith("Quoted") || r.shown.startsWith("Compared") ? (
                      r.shown
                    ) : (
                      <>
                        Calculated: <code className="font-mono text-foreground">{r.shown.split(" ")[0]}</code>
                        {r.shown.includes(" ") ? r.shown.slice(r.shown.indexOf(" ")) : ""}
                      </>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </Card>
      </ViewSection>

      <ViewSection
        id="calculations"
        title="The calculations"
        intro={
          <p>
            Each lives in one file of this site&apos;s source, <code className="font-mono text-sm">features/results/gods-hand/derive.ts</code>,
            under the name shown. They are display arithmetic only. Every verdict was decided by the project&apos;s own
            tools, before this page existed.
          </p>
        }
      >
        <Card>
          <dl className="divide-y divide-gold/10">
            {CALCS.map(([name, what]) => (
              <div key={name} className="grid gap-1 py-3 first:pt-0 last:pb-0 md:grid-cols-[16rem_1fr] md:gap-6">
                <dt className="font-mono text-[13px] text-gold">{name}</dt>
                <dd className="text-sm text-pretty text-foreground/85">{what}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </ViewSection>
    </div>
  );
}
