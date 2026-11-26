import { Card, DataTable, Definitions, Pill, Td, Th, ViewSection } from "../../ui";
import { benchFacts, embeddedWorst, stateBytes } from "../derive";
import { evidence } from "../evidence";
import { ESTIMATOR_INFO, Source, WorkInProgress } from "../shared";

/** Small angles in scientific notation, so 1e-12 and 0.01 stay readable side by side. */
const sci = (n: number) => (n === 0 ? "0" : n.toExponential(1).replace("e-", "×10⁻").replace("e+", "×10^"));

export function EmbeddedView() {
  const worst = embeddedWorst();
  const bench = benchFacts();
  const esp = evidence.esp32();
  const tests = evidence.tests();

  return (
    <div className="space-y-14">
      <WorkInProgress />

      <ViewSection
        id="c-vs-python"
        title="The C code against Python"
        intro={
          <p>
            Each estimator was rewritten in C99 for a microcontroller, with no dynamic memory, and built twice: with
            double precision and with single precision (float), which is what the ESP32&apos;s hardware does fast. Both
            were run on the same full 120 s scenarios as Python and compared sample by sample.
          </p>
        }
      >
        <Card bodyClassName="p-0 sm:p-0" source={<Source from="embedded" field="max_diff_vs_python_deg_f64, max_diff_vs_python_deg_f32" calc="embeddedWorst" />}>
          <DataTable caption="Largest attitude difference from Python over every scenario, degrees" className="rounded-none border-0">
            <thead>
              <tr>
                <Th>Estimator</Th>
                <Th numeric>Double</Th>
                <Th numeric>Float</Th>
                <Th>Worst float case</Th>
                <Th numeric>Memory (float)</Th>
              </tr>
            </thead>
            <tbody>
              {worst.map((w) => (
                <tr key={w.estimator}>
                  <Td>
                    <span className={ESTIMATOR_INFO[w.estimator].textClass}>{ESTIMATOR_INFO[w.estimator].name}</span>
                  </Td>
                  <Td numeric>{sci(w.f64)}°</Td>
                  <Td numeric>{w.f32.toFixed(4)}°</Td>
                  <Td mono className="text-xs">
                    {w.f32Scenario}
                  </Td>
                  <Td numeric>{stateBytes(w.estimator)} B</Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </Card>
        <p className="mt-3 text-sm text-pretty text-foreground/75">
          The Sun sensor&apos;s own noise is about 0.5°, so even the worst float difference is far below anything
          the sensors could notice. Memory is what the benchmark counts as state:
          the orientation, the gyro-error estimate and, for the Kalman filters, a 6×6 uncertainty matrix.
        </p>
      </ViewSection>

      <ViewSection
        id="firmware"
        title="The ESP32 firmware"
        intro={
          <p>
            A small app replays five seconds of simulated sensor data through all five C estimators, times every
            sample with the CPU&apos;s cycle counter and checks each answer against Python&apos;s. It builds for the
            classic ESP32 but has not run on a board yet. Below is the same benchmark built for a PC, to check its logic.
            PC timings say nothing about the ESP32, so they aren&apos;t shown.
          </p>
        }
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Benchmark on a PC" source={<Source from="bench" calc="benchFacts" />}>
            <DataTable caption="Firmware benchmark results on a PC" className="border-0">
              <thead>
                <tr>
                  <Th>Estimator</Th>
                  <Th numeric>Max difference</Th>
                  <Th>Result</Th>
                </tr>
              </thead>
              <tbody>
                {bench.rows.map((r) => (
                  <tr key={r.estimator}>
                    <Td>
                      <span className={ESTIMATOR_INFO[r.estimator].textClass}>{ESTIMATOR_INFO[r.estimator].name}</span>
                    </Td>
                    <Td numeric>{r.max_err_deg.toFixed(4)}°</Td>
                    <Td>{r.result === "PASS" ? <Pill tone="positive">✓ pass</Pill> : <Pill tone="negative">✕ fail</Pill>}</Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </Card>
          <Card title="Build for the ESP32" source={<Source from={["esp32", "tests"]} />}>
            <Definitions
              items={[
                { term: "Target", detail: esp["Target"] ?? "—" },
                { term: "Toolchain", detail: esp["Toolchain"] ?? "—" },
                { term: "Result", detail: esp["Result"] ?? "—" },
                { term: "App size", detail: esp["App size"] ?? "—" },
                { term: "Run on a board", detail: <Pill tone="gold">not yet</Pill> },
                { term: "Tests", detail: tests.line },
              ]}
            />
          </Card>
        </div>
      </ViewSection>
    </div>
  );
}
