import { fmtBytes, fmtDate } from "../../format";
import { Card, DataTable, Definitions, Td, Th, ViewSection } from "../../ui";
import { hostedFiles } from "../derive";
import { evidence, rawUrl } from "../evidence";

export function ProvenanceView() {
  const hosted = hostedFiles();
  const allOk = hosted.every((h) => h.ok);
  const source = evidence.source();

  return (
    <div className="space-y-14">
      <ViewSection
        id="files"
        title="The evidence files on this site"
        intro={
          <p>
            Every file this dashboard reads is hosted here, unchanged. Each was copied from the project&apos;s commit,
            not a working copy, so it is byte for byte the file in the repository. The SHA-256 column was computed
            when this site was built and is compared with the hash recorded at copy time.
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
              { term: "Verdicts committed", detail: fmtDate(source.checked_at) },
              { term: "Copied from", detail: source.copied_from },
              { term: "Copied by", detail: <code className="font-mono">{source.copied_by}</code> },
            ]}
          />
        </Card>
      </ViewSection>

      <ViewSection id="withheld" title="What isn't published, and why">
        <Card>
          <ul className="space-y-3 text-sm text-pretty text-foreground/85">
            <li>
              <strong className="text-foreground">The Java runs&apos; full logs.</strong> Besides the results, they
              print the service&apos;s connection details. Only their result lines are published, in{" "}
              <a href={rawUrl("evidence/part2/published-2026-11-24/java-results-extract.txt")} className="text-gold hover:underline">
                java-results-extract.txt
              </a>
              , each with its line number in the log.
            </li>
            <li>
              <strong className="text-foreground">Everything else is published.</strong> The model, the proofs
              (whose fingerprint each verdict records), the scripts that produced the summaries, and the raw outputs
              they were read from.
            </li>
          </ul>
        </Card>
      </ViewSection>
    </div>
  );
}
