"use client";

import { useState } from "react";
import { LineChart } from "../charts";
import { fmt1, fmt3, fmtInt } from "../format";
import { Picker } from "../picker";
import { DataTable, Td, Th } from "../ui";

/**
 * The two places a reader picks a configuration. Each receives only the rows
 * it shows, already read from benchmark.json on the server.
 */

const ROUND_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-5)"];

export interface TimelineConfig {
  label: string;
  name: string;
  /** Successful requests started in each second, one array per round. */
  rounds: number[][];
}

export function TimelineExplorer({ configs }: { configs: TimelineConfig[] }) {
  const [label, setLabel] = useState(configs[0]?.label ?? "");
  const config = configs.find((c) => c.label === label) ?? configs[0];
  if (!config) return null;
  return (
    <div className="space-y-4">
      <Picker label="Configuration" value={config.label} options={configs.map((c) => ({ value: c.label, label: c.name }))} onChange={setLabel} />
      <LineChart
        ariaLabel={`Successful requests per second for ${config.name}, one line per round`}
        series={config.rounds.map((values, i) => ({ name: `Round ${i + 1}`, color: ROUND_COLORS[i % ROUND_COLORS.length], values }))}
        xLabel={(i) => `${i}s`}
        yLabel="Successful requests per second"
      />
    </div>
  );
}

export interface OpsRow {
  rep: number;
  op: string;
  ok: number;
  errors: number;
  rps: number;
  p50: number;
  p95: number;
  p99: number;
  max: number;
}

export function OpsExplorer({ configs }: { configs: { label: string; name: string; rows: OpsRow[] }[] }) {
  const [label, setLabel] = useState(configs[0]?.label ?? "");
  const config = configs.find((c) => c.label === label) ?? configs[0];
  if (!config) return null;
  return (
    <div className="space-y-4">
      <Picker label="Configuration" value={config.label} options={configs.map((c) => ({ value: c.label, label: c.name }))} onChange={setLabel} />
      <DataTable caption={`Every operation in every round for ${config.name}`}>
        <thead>
          <tr>
            <Th numeric>Round</Th>
            <Th>Operation</Th>
            <Th numeric>Successful</Th>
            <Th numeric>Errors</Th>
            <Th numeric>req/s</Th>
            <Th numeric>p50 ms</Th>
            <Th numeric>p95 ms</Th>
            <Th numeric>p99 ms</Th>
            <Th numeric>max ms</Th>
          </tr>
        </thead>
        <tbody>
          {config.rows.map((r) => (
            <tr key={`${r.rep}-${r.op}`} className={r.op === config.rows[0].op && r.rep > 1 ? "[&>td]:border-t-gold/30" : undefined}>
              <Td numeric>{r.rep}</Td>
              <Td mono>{r.op}</Td>
              <Td numeric>{fmtInt(r.ok)}</Td>
              <Td numeric>{fmtInt(r.errors)}</Td>
              <Td numeric>{fmt1(r.rps)}</Td>
              <Td numeric>{fmt3(r.p50)}</Td>
              <Td numeric>{fmt3(r.p95)}</Td>
              <Td numeric>{fmt3(r.p99)}</Td>
              <Td numeric>{fmt3(r.max)}</Td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </div>
  );
}
