import Link from "next/link";
import { fmtDate, fmtRatio } from "../../format";
import { Card, DataTable, Definitions, Pill, Stat, Td, Th, ViewSection } from "../../ui";
import { speedStats, workloadParts } from "../derive";
import { speedEvidence, type SpeedRow } from "../evidence";
import { Source, VIEW } from "../shared";

const ENGINES = [
  {
    title: "Fork-and-sync",
    body: "Their own engine, called once per arriving activity, as their service does. Rejected on meaning, so timed for reference only.",
  },
  {
    title: "Full rebuild",
    body: "Every live activity re-applied in business order on each arrival: always correct, and what a simple fix does.",
  },
  {
    title: "Rebuild from the affected point",
    body: "The proved optimisation: keep everything before the late or reversed activity, re-apply only what follows.",
  },
];

const secs = (x: number | null) => (x === null ? "—" : x < 0.1 ? `${(x * 1000).toFixed(1)} ms` : `${x.toFixed(2)} s`);

function WorkloadTable({ rows, caption }: { rows: SpeedRow[]; caption: string }) {
  const checks = speedEvidence.summary().checks;
  return (
    <DataTable caption={caption} className="rounded-none border-0">
      <thead>
        <tr>
          <Th numeric>Activities</Th>
          <Th numeric>Late</Th>
          <Th>Backdated</Th>
          <Th numeric>Fork-and-sync</Th>
          <Th numeric>Full rebuild</Th>
          <Th numeric>From the affected point</Th>
          <Th numeric>Speed-up</Th>
          <Th>Call</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const w = workloadParts(r.config);
          const c = checks.find((x) => x.config === r.config);
          const forkDone = r.engines.forkSync.median_s !== null;
          return (
            <tr key={r.config}>
              <Td numeric>{w.n}</Td>
              <Td numeric>{`${Math.round(w.late * 100)}%`}</Td>
              <Td>{w.regime === "Recent" ? "a few days" : "anywhere back"}</Td>
              <Td numeric className={forkDone ? "text-muted-foreground" : "text-negative"}>
                {forkDone ? secs(r.engines.forkSync.median_s) : "didn't finish"}
                {forkDone && c?.forkSync_equals_full === false ? <span className="block text-[11px]">wrong answer</span> : null}
              </Td>
              <Td numeric>{secs(r.engines.full.median_s)}</Td>
              <Td numeric className="text-foreground">{secs(r.engines.partial.median_s)}</Td>
              <Td numeric className="font-semibold text-gold">
                {r.partial_vs_full_ratio === null ? "—" : fmtRatio(r.partial_vs_full_ratio)}
              </Td>
              <Td>
                <Pill tone={r.call === "faster" ? "positive" : "neutral"}>{r.call}</Pill>
              </Td>
            </tr>
          );
        })}
      </tbody>
    </DataTable>
  );
}

export function SpeedView() {
  const s = speedStats();
  const env = speedEvidence.env();
  const rows = speedEvidence.summary().rows;
  const without = rows.filter((r) => workloadParts(r.config).reversals === 0);
  const withRev = rows.filter((r) => workloadParts(r.config).reversals > 0);

  return (
    <div className="space-y-14">
      <ViewSection
        id="what"
        title="How much faster, in their own code"
        intro={
          <div className="space-y-3">
            <p>
              The optimisation was timed on Precise Ledger Pro&apos;s own Haskell port, unmodified, against the other
              two ways to handle a late or reversed activity. All three use the project&apos;s own ledger functions,
              process the same streams of activities, and store their state after every arrival, as a real system
              would.
            </p>
            <p>
              Meaning came first: on every workload, rebuilding from the affected point gave exactly the full
              rebuild&apos;s answer, balance and every activity&apos;s effect, before anything was timed.
            </p>
          </div>
        }
      >
        <ol className="grid gap-px overflow-hidden rounded-lg border border-gold/15 bg-gold/15 sm:grid-cols-3">
          {ENGINES.map((e, i) => (
            <li key={e.title} className="flex flex-col gap-2 bg-ocean-deep p-4">
              <span className="font-display text-2xl leading-none text-gold/80 tabular-nums">{i + 1}</span>
              <span className="font-semibold text-foreground">{e.title}</span>
              <span className="text-sm text-pretty text-muted-foreground">{e.body}</span>
            </li>
          ))}
        </ol>
      </ViewSection>

      <section aria-label="Speed figures" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Same answer as the full rebuild"
          value={`${s.partialEqualsFull} of ${s.workloads}`}
          detail="Balance and every live activity's effect, checked before timing."
          tone={s.partialEqualsFull === s.workloads ? "positive" : "negative"}
        />
        <Stat
          label="Faster than the full rebuild"
          value={`${s.faster} of ${s.workloads}`}
          detail="Called faster only when its slowest round beat the full rebuild's fastest."
          tone={s.faster === s.workloads ? "positive" : "gold"}
        />
        <Stat
          label="Median speed-up"
          value={fmtRatio(s.ratioMedian)}
          detail={`From ${fmtRatio(s.ratioMin)} to ${fmtRatio(s.ratioMax)} across the workloads.`}
          tone="gold"
        />
        <Stat
          label="Recent vs deep late events"
          value={`${fmtRatio(s.recentMedian)} / ${fmtRatio(s.deepMedian)}`}
          detail="Median speed-up when late activities go back a few days, and when they go back anywhere."
          tone="neutral"
        />
      </section>

      <ViewSection
        id="without"
        title="Without reversals"
        intro={
          <p>
            Here fork-and-sync finishes on all {s.noReversals.workloads} workloads, and beats the full rebuild on{" "}
            {s.noReversals.forkFasterThanFull}: the saving the paper describes is real. But it agrees with the full
            rebuild on only {s.noReversals.equalsFull} of {s.noReversals.workloads}, and rebuilding from the affected
            point is faster than it on {s.noReversals.partialFasterThanFork} of {s.noReversals.finished}.
          </p>
        }
      >
        <Card source={<Source from={["speedSummary", "speedRun"]} field="rows[].engines.*.median_s, partial_vs_full_ratio, call" calc="speedStats" />} bodyClassName="p-0 sm:p-0">
          <WorkloadTable rows={without} caption="Median time per workload, without reversals" />
        </Card>
      </ViewSection>

      <ViewSection
        id="with"
        title="With reversals"
        intro={
          <p>
            One in twenty arrivals is a reversal of an earlier activity. Fork-and-sync finished on{" "}
            {s.withReversals.finished} of {s.withReversals.workloads}; the rest ran out of memory ({s.heapOverflow}) or
            time ({s.timeLimit}).{" "}
            <Link href={VIEW("termination")} className="text-gold hover:underline">
              Why it doesn&apos;t finish
            </Link>
          </p>
        }
      >
        <Card source={<Source from={["speedSummary", "speedRun"]} field="rows[], checks[].forkSync_equals_full" calc="speedStats" />} bodyClassName="p-0 sm:p-0">
          <WorkloadTable rows={withRev} caption="Median time per workload, with reversals" />
        </Card>
      </ViewSection>

      <ViewSection id="method" title="How it was measured">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Method" source={<Source from={["bench", "summarise"]} />}>
            <ul className="space-y-2 text-sm text-pretty text-foreground/85">
              <li>
                {s.workloads} workloads: {s.sizes.join(", ")} activities; 10% or 50% arriving late; backdated a few
                days or anywhere back; with and without reversals. A fixed generator makes the same streams every
                time.
              </li>
              <li>One warm-up round, discarded, then three timed rounds, with the engines&apos; order rotated each round.</li>
              <li>Figures are the median of the timed rounds, as in part 1.</li>
              <li>A 60-second limit and a capped heap. An engine that doesn&apos;t finish in the warm-up is not timed again.</li>
            </ul>
          </Card>
          <Card title="Environment" source={<Source from="speedRun" field="first and last lines" />}>
            <Definitions
              items={[
                { term: "CPU", detail: `${env.cpu}, ${env.cpus} CPUs for the container` },
                { term: "Compiler", detail: `${env.ghc}, -O2` },
                { term: "Host", detail: `WSL2 ${env.hostKernel}, Docker, no network` },
                { term: "Run", detail: `${env.startedAt} to ${env.endedAt}` },
                { term: "Expires", detail: fmtDate(speedEvidence.expires()) },
                { term: "Benchmark", detail: <code className="font-mono text-xs">{env.benchSha256.slice(0, 16)}…</code> },
              ]}
            />
          </Card>
        </div>
      </ViewSection>

      <ViewSection id="limits" title="What it doesn't show">
        <Card source={<Source from="speedNotes" field="Caveats" />}>
          <ul className="space-y-3 text-sm text-pretty text-foreground/85">
            <li>
              <strong className="text-foreground">Their ledger sets the absolute times.</strong> It is a plain list:
              adding an entry appends and checks every existing entry for duplicates. Every engine pays that, so the
              full rebuild grows roughly with the cube of the ledger&apos;s length. The comparison is between
              strategies on the same functions, not between ideal implementations.
            </li>
            <li>
              <strong className="text-foreground">One machine, one run.</strong> Three timed rounds on a laptop. The
              figures expire on the date above.
            </li>
            <li>
              <strong className="text-foreground">A narrow workload.</strong> Fixed amounts and no interest, like the
              model the proofs are about.
            </li>
          </ul>
        </Card>
      </ViewSection>
    </div>
  );
}
