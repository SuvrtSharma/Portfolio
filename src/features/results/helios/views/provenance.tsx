import { fmtBytes, fmtDate } from "../../format";
import { Card, DataTable, Definitions, Td, Th, ViewSection } from "../../ui";
import { COMPUTATIONS, hostedFiles } from "../derive";
import { evidence, rawUrl } from "../evidence";

export function ProvenanceView() {
  const hosted = hostedFiles();
  const allOk = hosted.every((h) => h.ok);
  const source = evidence.source();
  const meta = evidence.metadata();

  return (
    <div className="space-y-14">
      <ViewSection
        id="files"
        title="The evidence files on this site"
        intro={
          <p>
            Every file this dashboard reads is hosted here, unchanged. Each was copied from the project&apos;s commit,
            not a working copy. The SHA-256 column was computed when this site was built and is compared with the hash
            recorded at copy time.
          </p>
        }
      >
        <div
          className={`mb-4 flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 text-sm ${allOk ? "border-positive/30 text-positive" : "border-negative/40 text-negative"}`}
        >
          <span className="font-semibold">
            {allOk ? "✓ Every hosted file matches its recorded hash." : "✕ A hosted file differs from its recorded hash."}
          </span>
        </div>
        <Card bodyClassName="p-0 sm:p-0">
          <DataTable caption="Hosted evidence files and their hashes" className="rounded-none border-0">
            <thead>
              <tr>
                <Th>File</Th>
                <Th numeric>Size</Th>
                <Th>SHA-256 at build</Th>
                <Th>Matches copy</Th>
              </tr>
            </thead>
            <tbody>
              {hosted.map((h) => (
                <tr key={h.file}>
                  <Td mono className="text-xs">
                    <a href={rawUrl(h.file)} className="text-gold hover:underline">
                      {h.file}
                    </a>
                  </Td>
                  <Td numeric>{fmtBytes(h.bytes)}</Td>
                  <Td mono className="text-xs">
                    {h.sha256.slice(0, 16)}…
                  </Td>
                  <Td className={h.ok ? "text-positive" : "text-negative"}>{h.ok ? "✓" : "✕"}</Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </Card>
      </ViewSection>

      <ViewSection id="source" title="Where they came from">
        <Card>
          <Definitions
            items={[
              { term: "Repository", detail: source.repository },
              { term: "Commit", detail: <code className="font-mono">{source.commit}</code> },
              { term: "Evidence committed", detail: fmtDate(source.committed_at) },
              { term: "Benchmark run", detail: `${fmtDate(meta.generated_utc)}, Python ${meta.python}, NumPy ${meta.numpy}, ${meta.machine}` },
              { term: "Seeds", detail: meta.seeds.join(", ") },
              { term: "Copied by", detail: <code className="font-mono">{source.copied_by}</code> },
            ]}
          />
        </Card>
      </ViewSection>

      <ViewSection id="computed" title="How each figure is computed">
        <Card>
          <Definitions items={COMPUTATIONS.map(([name, what]) => ({ term: <code className="font-mono">{name}</code>, detail: what }))} />
        </Card>
      </ViewSection>

      <ViewSection id="limits" title="What these results don't show">
        <Card>
          <ul className="space-y-3 text-sm text-pretty text-foreground/85">
            <li>
              <strong className="text-foreground">Real sensors.</strong> The noise, bias and drift levels are reasonable
              guesses for a low-cost MPU-6050 and a hobby Sun sensor, not measurements. Measuring real parts is the
              ground-rig phase.
            </li>
            <li>
              <strong className="text-foreground">Speed on the chip.</strong> The firmware compiles for the ESP32, but
              hasn&apos;t been timed on one. Python timings in the CSVs are desktop numbers, useful only to compare
              estimators with each other.
            </li>
            <li>
              <strong className="text-foreground">The source code.</strong> The repository is private for now. The
              evidence files are published in full.
            </li>
          </ul>
        </Card>
      </ViewSection>
    </div>
  );
}
