import { LineChart, RangeChart, ShareBar } from "../../charts";
import { fmt1, fmt3, fmtDate, fmtInt, fmtPercent, fmtRatio } from "../../format";
import { Card, DataTable, Definitions, Screenshot, Td, Th, ViewSection } from "../../ui";
import { configSummaries, observedMix, operations, p99ByOperation, shortName } from "../derive";
import { evidence } from "../evidence";
import { OpsExplorer, TimelineExplorer } from "../explorers";
import { CallPill, RolePill, roleColor, Source } from "../shared";

const MIX_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-4)", "var(--chart-5)", "var(--chart-3)"];
const OP_NAMES: Record<string, string> = {
  balance: "Balance",
  open_bills: "Open bills",
  bill: "Record a bill",
  payment: "Record a payment",
  reverse: "Reverse a payment",
};
const opName = (op: string) => OP_NAMES[op] ?? op;

export function SpeedView() {
  const b = evidence.benchmark();
  const configs = configSummaries();
  const base = configs.find((c) => c.role === "baseline");
  const ops = operations();
  const p99 = p99ByOperation();
  const p99Max = Math.max(...p99.flatMap((r) => ops.map((op) => r.p99[op])));
  const mix = observedMix();
  const readP50Max = Math.max(...configs.flatMap((c) => c.reps.map((r) => r.by_op.balance.p50_ms)));
  const fsync = evidence.fsync();
  const nagle = evidence.nagle();
  const run1 = evidence.run1().runs.find((r) => r.label === "baseline");

  return (
    <div className="space-y-14">
      <ViewSection
        id="support"
        title="What the speed numbers support"
        intro={
          <p>
            Every configuration ran once in each of three rounds. A configuration counts as{" "}
            <strong className="text-foreground">faster</strong>{" "}
            only if its slowest round beat the baseline&apos;s
            fastest, which means its dots sit entirely right of the shaded band. It counts as slower only in the
            opposite case. Anything overlapping the band is inside the noise.
          </p>
        }
      >
        <Card source={<Source from="benchmark" field="runs[].reps[].overall.throughput_rps" calc="configSummaries" />}>
          <RangeChart
            ariaLabel="Successful requests per second for each configuration in each round, against the baseline's range"
            unit="req/s"
            band={base ? { from: base.min, to: base.max } : undefined}
            bandLabel="Baseline, slowest to fastest round"
            rows={configs.map((c) => ({
              key: c.label,
              color: roleColor[c.role],
              label: (
                <span className="flex flex-col gap-1">
                  <span className="leading-tight">{c.name}</span>
                  <span>
                    <RolePill role={c.role} />
                  </span>
                </span>
              ),
              points: c.rounds.map((v, i) => ({ value: v, label: `${c.name}, round ${i + 1}: ${fmt1(v)} req/s` })),
              center: c.median,
              aside: (
                <span className="flex flex-col items-end gap-0.5">
                  <span className="text-foreground">{fmt1(c.median)}</span>
                  <span className="text-xs text-muted-foreground">{c.role === "baseline" ? "median" : fmtRatio(c.ratio)}</span>
                </span>
              ),
            }))}
          />
        </Card>

        <Card className="mt-4" bodyClassName="p-0 sm:p-0" source={<Source from="benchmark" field="runs[].reps[].overall" calc="configSummaries" />}>
          <DataTable caption="Speed result per configuration">
            <thead>
              <tr>
                <Th>Configuration</Th>
                <Th>Meaning</Th>
                <Th numeric>Round 1</Th>
                <Th numeric>Round 2</Th>
                <Th numeric>Round 3</Th>
                <Th numeric>Median</Th>
                <Th numeric>× baseline</Th>
                <Th>Speed result</Th>
              </tr>
            </thead>
            <tbody>
              {configs.map((c) => (
                <tr key={c.label}>
                  <Td>
                    <span className="block font-medium text-foreground">{c.name}</span>
                    <span className="block font-mono text-xs text-muted-foreground">{c.label}</span>
                  </Td>
                  <Td>
                    <RolePill role={c.role} />
                  </Td>
                  {c.rounds.map((v, i) => (
                    <Td key={i} numeric>
                      {fmt1(v)}
                    </Td>
                  ))}
                  <Td numeric className="text-foreground">{fmt1(c.median)}</Td>
                  <Td numeric>{fmtRatio(c.ratio)}</Td>
                  <Td>
                    <CallPill call={c.call} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </Card>
      </ViewSection>

      <ViewSection
        id="over-time"
        title="Second by second"
        intro={
          <p>
            Medians hide stalls. These lines show successful requests started in each second of each round, so a
            disk stall shows up as a dip. The last second of each round is partial.
          </p>
        }
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Requests per second, per round" source={<Source from="benchmark" field="runs[].reps[].ok_per_second" />}>
            <TimelineExplorer configs={configs.map((c) => ({ label: c.label, name: c.name, rounds: c.reps.map((r) => r.ok_per_second) }))} />
          </Card>
          <Card
            title="The disk on its own"
            description="A bare fsync loop with no database, run twice on the same WSL2 virtual disk. Its sync rate wandered several-fold within a minute, which is why every configuration is measured in interleaved rounds."
            source={<Source from="fsync" field="per_second, p50_ms, p99_ms" />}
          >
            <LineChart
              ariaLabel="fsync calls completed per second in two probes of the disk"
              series={fsync.map((t, i) => ({ name: `Probe ${i + 1}: ${fmtInt(t.fsyncs)} fsyncs, p99 ${fmt3(t.p99_ms)} ms`, color: ["var(--chart-4)", "var(--chart-5)"][i % 2], values: t.per_second }))}
              xLabel={(i) => `${i}s`}
              yLabel="fsyncs per second"
            />
          </Card>
        </div>
      </ViewSection>

      <ViewSection
        id="latency"
        title="Latency by operation"
        intro={
          <div className="space-y-3">
            <p>
              The median over the three rounds of each round&apos;s 99th-percentile latency, in milliseconds. Darker
              cells are slower.
            </p>
            <p>
              Compare the balance column. With SQLite&apos;s default rollback journal, the slowest reads wait as long
              as the stalled writes, which fits readers waiting for the writer&apos;s lock. In WAL mode, readers
              don&apos;t wait for writers (
              <a href="https://www.sqlite.org/wal.html" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
                SQLite documentation
              </a>
              ), and the read tail stays in single-digit milliseconds. Medians alone would have hidden this: no
              round&apos;s median read took longer than {fmt3(readP50Max)} ms.
            </p>
          </div>
        }
      >
        <Card bodyClassName="p-0 sm:p-0" source={<Source from="benchmark" field="runs[].reps[].by_op[].p99_ms" calc="p99ByOperation" />}>
          <DataTable caption="Median p99 latency in milliseconds by configuration and operation">
            <thead>
              <tr>
                <Th>Configuration</Th>
                {ops.map((op) => (
                  <Th key={op} numeric>
                    {opName(op)}
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {p99.map((r) => (
                <tr key={r.label}>
                  <Td className="font-medium text-foreground">{r.name}</Td>
                  {ops.map((op) => (
                    <Td
                      key={op}
                      numeric
                      style={{ backgroundColor: `color-mix(in oklab, var(--brand-gold) ${Math.round((r.p99[op] / p99Max) * 38)}%, transparent)` }}
                    >
                      {fmt3(r.p99[op])}
                    </Td>
                  ))}
                </tr>
              ))}
            </tbody>
          </DataTable>
        </Card>
      </ViewSection>

      <ViewSection id="how" title="How it was measured">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card
            title="Load"
            description="Each configuration ran on a fresh server container with its own database volume, seeded with the same data. The load generator ran in its own container on separate CPUs."
            source={<Source from="benchmark" field="load, environment" />}
          >
            <Definitions
              items={[
                { term: "Clients", detail: `${fmtInt(b.load.threads)} concurrent threads` },
                { term: "Each round", detail: `${fmtInt(b.load.seconds)} s measured, after an unmeasured ${fmtInt(b.load.warmup_seconds)} s warm-up` },
                { term: "Data", detail: `${fmtInt(b.load.parties)} parties, ${fmtInt(b.load.bills_per_party)} bills each, seeded before measuring` },
                { term: "CPUs", detail: `Server on ${String(b.environment.server_cpuset)}, load generator on ${String(b.environment.client_cpuset)}` },
                { term: "Storage", detail: String(b.environment.storage) },
              ]}
            />
          </Card>
          <Card
            title="The operation mix, as observed"
            description="Successful requests by operation, over every configuration and round."
            source={<Source from="benchmark" field="runs[].reps[].by_op[].ok" calc="observedMix" />}
          >
            <ShareBar
              parts={mix.map((m, i) => ({
                key: m.op,
                label: opName(m.op),
                share: m.share,
                color: MIX_COLORS[i % MIX_COLORS.length],
                detail: `${fmtPercent(m.share)} · ${fmtInt(m.ok)}`,
              }))}
            />
          </Card>
          <Card
            title="Round order"
            description="Shuffled each round, with the baseline measured again in every round, so a drifting disk can't masquerade as an effect of whichever configuration happened to run then."
            source={<Source from="benchmark" field="interleaved_order" />}
          >
            <ol className="space-y-3">
              {b.interleaved_order.map((order, i) => (
                <li key={i} className="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:gap-3">
                  <span className="w-16 shrink-0 text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">Round {i + 1}</span>
                  <ol className="flex flex-wrap gap-1.5">
                    {order.map((label, j) => (
                      <li key={label} className="rounded border border-gold/15 bg-ocean-deep px-1.5 py-0.5 text-xs text-foreground/85">
                        <span className="mr-1 text-muted-foreground tabular-nums">{j + 1}</span>
                        {shortName(label)}
                      </li>
                    ))}
                  </ol>
                </li>
              ))}
            </ol>
          </Card>
          <Card
            title="Warm-up and sanity check"
            description={`A configuration fails if its fastest balance-read median is above ${fmt1(b.runs[0].sanity.floor_ms)} ms: a trivial read that slow would mean the run measured the network, as the first run did.`}
            source={<Source from="benchmark" field="runs[].warmup, runs[].sanity" />}
            bodyClassName="px-0 sm:px-0 pb-0"
          >
            <DataTable caption="Warm-up and sanity check per configuration" className="rounded-none border-x-0 border-b-0">
              <thead>
                <tr>
                  <Th>Configuration</Th>
                  <Th numeric>Fastest balance p50</Th>
                  <Th>Sanity</Th>
                </tr>
              </thead>
              <tbody>
                {b.runs.map((r) => (
                  <tr key={r.label}>
                    <Td>{shortName(r.label)}</Td>
                    <Td numeric>{fmt3(r.sanity.balance_p50_min_ms)} ms</Td>
                    <Td className={r.sanity.ok ? "whitespace-nowrap text-positive" : "whitespace-nowrap text-negative"}>
                      {r.sanity.ok ? "✓ Passed" : "✕ Failed"}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </Card>
        </div>
      </ViewSection>

      <ViewSection
        id="rounds"
        title="Every round, in full"
        intro={<p>The raw figures behind every chart above, as the load generator recorded them.</p>}
      >
        <div className="space-y-4">
          <Card title="Overall, per round" bodyClassName="p-0 sm:p-0" source={<Source from="benchmark" field="runs[].reps[].overall, samples_sha256" />}>
            <DataTable caption="Overall figures for every configuration and round">
              <thead>
                <tr>
                  <Th>Configuration</Th>
                  <Th numeric>Round</Th>
                  <Th numeric>Requests</Th>
                  <Th numeric>Errors</Th>
                  <Th numeric>req/s</Th>
                  <Th numeric>p50 ms</Th>
                  <Th numeric>p95 ms</Th>
                  <Th numeric>p99 ms</Th>
                  <Th numeric>max ms</Th>
                  <Th>Samples file SHA-256</Th>
                </tr>
              </thead>
              <tbody>
                {configs.flatMap((c) =>
                  c.reps.map((r, i) => (
                    <tr key={`${c.label}-${i}`}>
                      <Td className="whitespace-nowrap">{c.name}</Td>
                      <Td numeric>{i + 1}</Td>
                      <Td numeric>{fmtInt(r.overall.requests)}</Td>
                      <Td numeric>{fmtInt(r.overall.errors)}</Td>
                      <Td numeric>{fmt1(r.overall.throughput_rps)}</Td>
                      <Td numeric>{fmt3(r.overall.p50_ms)}</Td>
                      <Td numeric>{fmt3(r.overall.p95_ms)}</Td>
                      <Td numeric>{fmt3(r.overall.p99_ms)}</Td>
                      <Td numeric>{fmt3(r.overall.max_ms)}</Td>
                      <Td mono className="text-xs text-muted-foreground" title={`${r.samples_file ?? ""} ${r.samples_sha256 ?? ""}`}>
                        {r.samples_sha256 ? `${r.samples_sha256.slice(0, 16)}…` : ""}
                      </Td>
                    </tr>
                  )),
                )}
              </tbody>
            </DataTable>
          </Card>
          <Card title="Every operation, every round" source={<Source from="benchmark" field="runs[].reps[].by_op" />}>
            <OpsExplorer
              configs={configs.map((c) => ({
                label: c.label,
                name: c.name,
                rows: c.reps.flatMap((r, i) =>
                  Object.entries(r.by_op).map(([op, s]) => ({ rep: i + 1, op, ok: s.ok, errors: s.errors, rps: s.throughput_rps, p50: s.p50_ms, p95: s.p95_ms, p99: s.p99_ms, max: s.max_ms })),
                ),
              }))}
            />
          </Card>
        </div>
      </ViewSection>

      <ViewSection
        id="run-1"
        title="Why the first run was thrown away"
        intro={
          <p>
            Run 1, on {fmtDate(evidence.run1().started_at)}, left Nagle&apos;s algorithm on. Each small response waited for the
            client&apos;s delayed acknowledgement, so it measured TCP, not the database. A controlled experiment
            confirmed it. Run 1 is kept as evidence and not used.
          </p>
        }
      >
        <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
          <Card title="The controlled experiment" bodyClassName="px-0 sm:px-0 pb-0" source={<Source from="nagle" field="one line per trial (only the printed output was kept)" />}>
            <DataTable caption="Nagle's algorithm on, against TCP_NODELAY" className="rounded-none border-x-0 border-b-0">
              <thead>
                <tr>
                  <Th>Server setting</Th>
                  <Th numeric>Trial</Th>
                  <Th numeric>req/s</Th>
                  <Th numeric>Balance p50</Th>
                  <Th numeric>Open bills p50</Th>
                  <Th numeric>Payment p50</Th>
                </tr>
              </thead>
              <tbody>
                {nagle.map((t) => (
                  <tr key={`${t.mode}-${t.trial}`}>
                    <Td className={t.mode === "Nagle on" ? "text-negative" : "text-positive"}>{t.mode}</Td>
                    <Td numeric>{t.trial}</Td>
                    <Td numeric>{fmt1(t.rps)}</Td>
                    <Td numeric>{fmt3(t.balance_p50_ms)} ms</Td>
                    <Td numeric>{fmt3(t.open_p50_ms)} ms</Td>
                    <Td numeric>{fmt3(t.payment_p50_ms)} ms</Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </Card>
          <Card
            title="Run 1's baseline balance read"
            description={`Median latency of a trivial read, per round. The sanity check that now fails a run like this flags anything above ${fmt1(b.runs[0].sanity.floor_ms)} ms.`}
            source={<Source from="run1" field="runs[baseline].reps[].by_op.balance.p50_ms" />}
          >
            <ul className="flex flex-wrap gap-2">
              {(run1?.reps ?? []).map((r, i) => (
                <li key={i} className="rounded-md border border-negative/30 px-3 py-2">
                  <span className="block text-xs text-muted-foreground">Round {i + 1}</span>
                  <span className="font-display text-xl text-negative tabular-nums">{fmt3(r.by_op.balance.p50_ms)}</span>
                  <span className="ml-1 text-xs text-muted-foreground">ms</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </ViewSection>

      <ViewSection id="profile" title="Where the baseline spends its time">
        <Card
          description="cProfile of the baseline store in the checker container, sorted by time spent in each function itself. Measured before any optimisation was accepted."
          source={<Source from="verdicts" field="profile_baseline" />}
        >
          <details className="group">
            <summary className="cursor-pointer text-sm text-gold hover:underline">Show the profile</summary>
            <pre className="mt-3 max-h-[28rem] overflow-auto rounded-md border border-gold/15 bg-ocean-deep p-3 font-mono text-xs leading-relaxed text-foreground/85">
              {evidence.verdicts().profile_baseline}
            </pre>
          </details>
        </Card>
      </ViewSection>

      <ViewSection id="terminal" title="The same run, in the terminal">
        <div className="max-w-3xl">
          <Screenshot src="/blog/gods-hand/after.png" alt="Terminal output of the after phase: each configuration's rounds, median and ratio to the baseline" command="python3 bench/docker_run.py after --each">
            The figures above are read from the files this command wrote.
          </Screenshot>
        </div>
      </ViewSection>
    </div>
  );
}
