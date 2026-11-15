import { fmtBytes, fmtDate } from "../../format";
import { Card, DataTable, Definitions, Pill, Screenshot, Td, Th, ViewSection } from "../../ui";
import { evidence, fingerprint, FILES, rawUrl, RUN } from "../evidence";
import { Source } from "../shared";

const ENV_LABELS: Record<string, string> = {
  host: "Host kernel",
  cpu_model: "CPU",
  vm_cpus: "CPUs in the VM",
  vm_memory_kib: "Memory in the VM (KiB)",
  docker: "Docker Engine",
  container_python_sqlite: "Python and SQLite in the containers",
  server_cpuset: "Server CPUs",
  client_cpuset: "Load generator CPUs",
  storage: "Storage",
  tcp_nodelay: "TCP_NODELAY",
};

export function ProvenanceView() {
  const b = evidence.benchmark();
  const v = evidence.verdicts();
  const manifest = evidence.manifest();
  const source = evidence.source();
  const runPrefix = `evidence/${RUN}/`;

  const hosted = Object.values(FILES).map((file) => {
    const now = fingerprint(file);
    const inManifest = file.startsWith(runPrefix) ? manifest.files[file.slice(runPrefix.length)] : undefined;
    return {
      file,
      ...now,
      copied: source.files[file],
      manifest: inManifest,
      okCopy: source.files[file] === now.sha256,
      okManifest: inManifest === undefined ? null : inManifest === now.sha256,
    };
  });
  const allOk = hosted.every((h) => h.okCopy && h.okManifest !== false);
  const hostedNames = new Set(hosted.map((h) => h.file.slice(runPrefix.length)));
  const images = (b.environment.images ?? {}) as Record<string, string>;

  return (
    <div className="space-y-14">
      <ViewSection
        id="files"
        title="The evidence files on this site"
        intro={
          <p>
            Every file this dashboard reads is hosted here, unchanged. The SHA-256 column was computed when this site
            was built, and is compared with the hash recorded when the file was copied from the project and, for
            files from the run itself, with the run&apos;s own manifest.
          </p>
        }
      >
        <div
          className={`mb-4 flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 text-sm ${allOk ? "border-positive/30 text-positive" : "border-negative/40 text-negative"}`}
        >
          <span className="font-semibold">
            {allOk ? "✓ Every hosted file matches its recorded hash." : "✕ A hosted file differs from its recorded hash."}
          </span>
          <span className="text-muted-foreground">
            Copied from the project at commit <code className="font-mono text-foreground/85">{source.commit.slice(0, 12)}</code>
            {source.uncommitted_changes.length ? ", with uncommitted changes" : ", with no uncommitted changes"}.
          </span>
        </div>
        <Card bodyClassName="p-0 sm:p-0" source={<SourceList />}>
          <DataTable caption="Hosted evidence files and their hashes">
            <thead>
              <tr>
                <Th>File</Th>
                <Th numeric>Size</Th>
                <Th>SHA-256, computed at build</Th>
                <Th>Matches the copy record</Th>
                <Th>Matches the run manifest</Th>
              </tr>
            </thead>
            <tbody>
              {hosted.map((h) => (
                <tr key={h.file}>
                  <Td className="min-w-64">
                    <a href={rawUrl(h.file)} className="font-mono text-[13px] text-gold underline decoration-gold/30 underline-offset-2 hover:decoration-gold">
                      {h.file}
                    </a>
                  </Td>
                  <Td numeric>{fmtBytes(h.bytes)}</Td>
                  <Td mono className="text-xs break-all text-foreground/75">{h.sha256}</Td>
                  <Td>{h.okCopy ? <Pill tone="positive">✓ Yes</Pill> : <Pill tone="negative">✕ No</Pill>}</Td>
                  <Td>
                    {h.okManifest === null ? (
                      <span className="text-xs text-muted-foreground">Not part of the run</span>
                    ) : h.okManifest ? (
                      <Pill tone="positive">✓ Yes</Pill>
                    ) : (
                      <Pill tone="negative">✕ No</Pill>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </Card>
      </ViewSection>

      <ViewSection
        id="run"
        title="The run"
        intro={
          <p>
            Recorded by the orchestrator inside WSL2.{" "}
            {b.git.dirty_files.every((f) => f.startsWith("??"))
              ? "Every uncommitted path git reported at the time was an untracked file or folder (run output and screenshots), so the code that ran is the commit shown."
              : "Git reported modified tracked files at the time, listed below, so the code that ran differs from the commit shown."}
          </p>
        }
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Run and code" source={<Source from={["benchmark", "verdicts"]} field="run_id, started_at, expires, git; environment" />}>
            <Definitions
              items={[
                { term: "Run", detail: <code className="font-mono text-[13px]">{b.run_id}</code> },
                { term: "Started", detail: `${fmtDate(b.started_at)}, ${b.started_at.slice(11, 19)} UTC` },
                { term: "Measurements expire", detail: fmtDate(b.expires) },
                { term: "Commit", detail: <code className="font-mono text-[13px] break-all">{b.git.commit}</code> },
                {
                  term: "Uncommitted paths",
                  detail: (
                    <ul className="space-y-0.5">
                      {b.git.dirty_files.map((f) => (
                        <li key={f} className="font-mono text-xs">
                          {f}
                        </li>
                      ))}
                    </ul>
                  ),
                },
                { term: "Tests in this run", detail: b.tests.summary },
                { term: "Lean", detail: String(v.environment.lean) },
                { term: "Checker platform", detail: <span className="break-all">{String(v.environment.platform)}</span> },
              ]}
            />
          </Card>
          <Card title="Machine and containers" source={<Source from="benchmark" field="environment" />}>
            <Definitions
              items={[
                ...Object.entries(ENV_LABELS)
                  .filter(([k]) => b.environment[k] !== undefined)
                  .map(([k, label]) => ({ term: label, detail: String(b.environment[k]) })),
                ...Object.entries(images).map(([name, digest]) => ({
                  term: name,
                  detail: <code className="font-mono text-xs break-all">{digest}</code>,
                })),
              ]}
            />
          </Card>
        </div>
      </ViewSection>

      <ViewSection
        id="manifest"
        title="The run's own manifest"
        intro={
          <p>
            Every file the run wrote, with the SHA-256 recorded at the time. The per-request sample files aren&apos;t
            hosted here because of their size, but their hashes are listed, and each round&apos;s figures name the
            sample file they came from.
          </p>
        }
      >
        <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
          <Card bodyClassName="p-0 sm:p-0" source={<Source from="manifest" field="files" />}>
            <DataTable caption="Files in the run's manifest" maxHeight="30rem">
              <thead>
                <tr>
                  <Th>File</Th>
                  <Th>SHA-256</Th>
                  <Th>Hosted</Th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(manifest.files).map(([file, sha]) => (
                  <tr key={file}>
                    <Td mono className="text-xs">{file}</Td>
                    <Td mono className="text-xs break-all text-foreground/70">{sha}</Td>
                    <Td className="text-xs">{hostedNames.has(file) ? <span className="text-positive">Yes</span> : <span className="text-muted-foreground">No</span>}</Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </Card>
          <Screenshot src="/blog/gods-hand/manifest.png" alt="verify_manifest re-hashing every file of the run: all match" command="python3 bench/verify_manifest.py">
            The owner re-hashed every file of the run against this manifest.
          </Screenshot>
        </div>
      </ViewSection>
    </div>
  );
}

function SourceList() {
  return <Source from="manifest" field="files; and source.json, written by scripts/results/sync-gods-hand.mjs" />;
}
