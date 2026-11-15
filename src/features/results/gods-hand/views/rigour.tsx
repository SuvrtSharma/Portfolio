import { fmt1, fmt3, fmtInt } from "../../format";
import { Card, DataTable, Pill, Screenshot, Stat, Td, Th, ViewSection } from "../../ui";
import { mutationCounts, mutationRows, testCounts, testsByFile } from "../derive";
import { evidence } from "../evidence";
import { Source } from "../shared";

export function RigourView() {
  const tests = testCounts();
  const muts = mutationCounts();
  const rows = mutationRows();
  const scopes = [...new Set(rows.map((r) => r.scope))];
  const restored = evidence.mutations().restored;

  return (
    <div className="space-y-14">
      <section aria-label="Test figures" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Tests passed" value={fmtInt(tests.passed)} tone="positive" source={<Source from="tests" calc="testCounts" />} />
        <Stat label="Tests failed" value={fmtInt(tests.failed)} tone={tests.failed ? "negative" : "positive"} source={<Source from="tests" calc="testCounts" />} />
        <Stat label="Tests skipped" value={fmtInt(tests.skipped)} tone="neutral" source={<Source from="tests" calc="testCounts" />} />
        <Stat
          label="Mutations that bit"
          value={`${muts.bit} of ${muts.total}`}
          tone={muts.bit === muts.total ? "positive" : "negative"}
          source={<Source from="mutations" field="rows[].result" calc="mutationCounts" />}
        />
      </section>

      <ViewSection
        id="mutations"
        title="Does each check bite?"
        intro={
          <p>
            A check is only worth something if it can fail. Each row removes one check by changing one line of the
            tooling, then runs the tests that guard it. &ldquo;Bites&rdquo; means those tests failed, as they should.
            Every file was restored byte for byte afterwards
            {restored ? "" : " (restore failed: see the raw file)"}. The runs happened in the checker container, on a
            copy of the code.
          </p>
        }
      >
        <div className="space-y-6">
          {scopes.map((scope) => (
            <Card
              key={scope}
              title={scope}
              bodyClassName="p-0 sm:p-0"
              source={<Source from={["mutations", "catalog"]} field="rows[], mutations[] joined by name" calc="mutationRows" />}
            >
              <DataTable caption={`Mutations: ${scope}`}>
                <thead>
                  <tr>
                    <Th>Mutation</Th>
                    <Th>The change</Th>
                    <Th>Tests run</Th>
                    <Th>Result</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows
                    .filter((r) => r.scope === scope)
                    .map((r) => (
                      <tr key={r.code}>
                        <Td className="min-w-44">
                          <span className="font-mono text-[13px] text-gold">{r.code}</span>{" "}
                          <span className="text-foreground">{r.name}</span>
                          <span className="mt-1 block font-mono text-xs text-muted-foreground">{r.file}</span>
                        </Td>
                        <Td className="min-w-72">
                          <pre className="overflow-x-auto rounded border border-gold/10 bg-ocean-deep px-2 py-1.5 font-mono text-xs leading-relaxed">
                            <span className="block text-negative">− {r.find}</span>
                            <span className="block text-positive">+ {r.replace}</span>
                          </pre>
                        </Td>
                        <Td mono className="min-w-36 text-xs">
                          -k &quot;{r.tests}&quot;
                        </Td>
                        <Td className="min-w-40">
                          <Pill tone={r.bites ? "positive" : "negative"}>{r.bites ? "✓ Bites" : `✕ ${r.result}`}</Pill>
                          <span className="mt-1.5 block text-xs text-muted-foreground">{r.summary}</span>
                        </Td>
                      </tr>
                    ))}
                </tbody>
              </DataTable>
            </Card>
          ))}
        </div>
      </ViewSection>

      <ViewSection
        id="tests"
        title="The test suite"
        intro={<p>pytest&apos;s report from the Linux checker container, written during this run.</p>}
      >
        <div className="space-y-4">
          <Card bodyClassName="p-0 sm:p-0" source={<Source from="tests" field="testcase elements" calc="testsByFile" />}>
            <DataTable caption="Tests by file">
              <thead>
                <tr>
                  <Th>Test file</Th>
                  <Th numeric>Passed</Th>
                  <Th numeric>Failed</Th>
                  <Th numeric>Skipped</Th>
                  <Th numeric>Seconds</Th>
                </tr>
              </thead>
              <tbody>
                {testsByFile().map((f) => (
                  <tr key={f.file}>
                    <Td mono>{f.file}</Td>
                    <Td numeric className="text-positive">{fmtInt(f.passed)}</Td>
                    <Td numeric className={f.failed ? "text-negative" : undefined}>{fmtInt(f.failed)}</Td>
                    <Td numeric>{fmtInt(f.skipped)}</Td>
                    <Td numeric>{fmt1(f.seconds)}</Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </Card>

          <Card source={<Source from="tests" field="testcase elements" />}>
            <details>
              <summary className="cursor-pointer text-sm text-gold hover:underline">Show all {fmtInt(tests.total)} tests</summary>
              <DataTable caption="Every test case" className="mt-3" maxHeight="34rem">
                <thead>
                  <tr>
                    <Th>Test</Th>
                    <Th>Outcome</Th>
                    <Th numeric>Seconds</Th>
                    <Th>Message</Th>
                  </tr>
                </thead>
                <tbody>
                  {evidence.tests().map((t) => (
                    <tr key={`${t.file}::${t.name}`}>
                      <Td mono className="text-xs break-all">
                        <span className="text-muted-foreground">{t.file}::</span>
                        {t.name}
                      </Td>
                      <Td>
                        <Pill tone={t.outcome === "passed" ? "positive" : t.outcome === "failed" ? "negative" : "neutral"}>{t.outcome}</Pill>
                      </Td>
                      <Td numeric>{fmt3(t.seconds)}</Td>
                      <Td className="text-xs text-muted-foreground">{t.message}</Td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            </details>
          </Card>
        </div>
      </ViewSection>

      <ViewSection id="terminal" title="The same checks, in the terminal">
        <div className="max-w-3xl">
          <Screenshot src="/blog/gods-hand/mutations.png" alt="Each mutation applied in turn, with the tests that failed" command="docker run --rm -t godshand/checker:dev python tools/mutate.py" />
        </div>
      </ViewSection>
    </div>
  );
}
