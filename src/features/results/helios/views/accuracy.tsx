import { fmt2 } from "../../format";
import { RangeChart } from "../../charts";
import { Card, DataTable, Td, Th, ViewSection } from "../../ui";
import { acrossScenarios, cell, runCounts, scenarios, seedSpread } from "../derive";
import { ESTIMATORS } from "../evidence";
import { ESTIMATOR_INFO, Source, WorkInProgress } from "../shared";

const CHARTED = ["static", "multi_axis_handling", "gyro_saturation"] as const;

const SCENARIO_NOTE: Record<string, string> = {
  static: "Sitting still. Pure drift.",
  single_axis_sweep: "Swinging ±30° about one axis.",
  sun_axis_spin: "Spinning about the line to the Sun.",
  multi_axis_handling: "Slow wobble on all axes, like hand-held.",
  sun_dropout_30s: "Hand-held, Sun blocked from 40 to 70 s.",
  gyro_saturation: "Swinging, plus 1 s spun faster than the gyro can measure.",
  thermal_ramp: "Hand-held while the board heats from 20 to 50 °C.",
  intermittent_cloud: "Hand-held under random short clouds.",
};

export function AccuracyView() {
  const c = runCounts();
  const scns = scenarios();

  return (
    <div className="space-y-14">
      <WorkInProgress />

      <ViewSection
        id="table"
        title="Typical error, every scenario"
        intro={
          <p>
            RMS (root mean square) attitude error in degrees: a typical error over the whole two-minute run, where
            big mistakes count extra. Each cell is the mean over {c.seeds} seeds. Lower is better.
          </p>
        }
      >
        <Card bodyClassName="p-0 sm:p-0" source={<Source from="summary" field="rms_total_deg_mean" calc="acrossScenarios" />}>
          <DataTable caption="RMS total error by scenario and estimator, degrees" className="rounded-none border-0">
            <thead>
              <tr>
                <Th>Scenario</Th>
                {ESTIMATORS.map((e) => (
                  <Th key={e} numeric>
                    <span className={ESTIMATOR_INFO[e].textClass}>{ESTIMATOR_INFO[e].name}</span>
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scns.map((s) => (
                <tr key={s}>
                  <Td>
                    <span className="font-mono text-xs">{s}</span>
                    <span className="block text-xs text-muted-foreground">{SCENARIO_NOTE[s] ?? ""}</span>
                  </Td>
                  {ESTIMATORS.map((e) => (
                    <Td key={e} numeric>
                      {fmt2(cell(s, e, "rms_total_deg_mean"))}
                    </Td>
                  ))}
                </tr>
              ))}
              <tr>
                <Td className="font-semibold">Mean of all scenarios</Td>
                {ESTIMATORS.map((e) => (
                  <Td key={e} numeric className="font-semibold">
                    {fmt2(acrossScenarios(e, "rms_total_deg_mean"))}
                  </Td>
                ))}
              </tr>
            </tbody>
          </DataTable>
        </Card>
        <p className="mt-3 text-sm text-foreground/75">
          All {c.runs} runs stayed finite: {c.allFinite ? "no estimator blew up" : "at least one estimator blew up"}.
        </p>
      </ViewSection>

      <ViewSection
        id="seeds"
        title="Every seed, three scenarios"
        intro={<p>Each dot is one seed&apos;s run. The bar spans the best and worst seed; the tick is the median.</p>}
      >
        <div className="grid gap-4">
          {CHARTED.map((s) => {
            const rows = seedSpread(s);
            return (
              <Card key={s} title={<span className="font-mono">{s}</span>} description={SCENARIO_NOTE[s]} source={<Source from="runs" field="rms_total_deg" calc="seedSpread" />}>
                <RangeChart
                  unit="°"
                  ariaLabel={`RMS total error per seed in ${s}`}
                  rows={rows.map((r) => ({
                    key: r.estimator,
                    label: <span className={ESTIMATOR_INFO[r.estimator].textClass}>{ESTIMATOR_INFO[r.estimator].name}</span>,
                    color: ESTIMATOR_INFO[r.estimator].textClass,
                    points: r.points.map((p) => ({ value: p.value, label: `seed ${p.seed}: ${fmt2(p.value)}°` })),
                    center: r.median,
                    aside: <span className="tabular-nums">{fmt2(r.median)}°</span>,
                  }))}
                />
              </Card>
            );
          })}
        </div>
      </ViewSection>
    </div>
  );
}
