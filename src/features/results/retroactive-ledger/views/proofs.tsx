import { Card, CodeBlock, DataTable, Td, Th, ViewSection } from "../../ui";
import { chainChecks, proofResults, statements } from "../derive";
import { evidence } from "../evidence";
import { AcceptedPill, Source } from "../shared";

function Check({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={ok ? "text-positive" : "text-negative"}>
      <span className="font-semibold">{ok ? "✓" : "✕"}</span> <span className="text-foreground/85">{children}</span>
    </li>
  );
}

export function ProofsView() {
  const proofs = proofResults();
  const chain = chainChecks();

  return (
    <div className="space-y-14">
      <ViewSection
        id="chain"
        title="From the published model to the verdicts"
        intro={
          <p>
            The checker accepts a proof only against the owner&apos;s lock: SHA-256 fingerprints of the model. These
            links were checked when this site was built, from the files hosted here.
          </p>
        }
      >
        <Card source={<Source from={["spec", "lock", "proofsSource", "verdict_rebuildFromInsertExact"]} field="files, lock_sha256, proof_file_sha256" calc="chainChecks" />}>
          <ul className="space-y-2 text-sm">
            <Check ok={chain.specMatchesLock}>
              The published model, <code className="font-mono">Spec/Retro.lean</code>, has the fingerprint the
              owner&apos;s lock records for it (<code className="font-mono">{chain.specInLock.slice(0, 16)}…</code>).
            </Check>
            <Check ok={chain.lockMatchesVerdicts}>
              Every verdict names the published lock file&apos;s fingerprint (
              <code className="font-mono">{chain.lockNow.slice(0, 16)}…</code>).
            </Check>
            <Check ok={chain.oneProofFile}>
              Every verdict was checked against the same proof file (
              <code className="font-mono">{chain.proofFile.slice(0, 16)}…</code>).
            </Check>
            <Check ok={chain.proofsMatchVerdicts}>
              The published proofs, <code className="font-mono">Proofs/Retro.lean</code>, are that proof file (
              <code className="font-mono">{chain.proofsNow.slice(0, 16)}…</code>).
            </Check>
          </ul>
        </Card>
      </ViewSection>

      <ViewSection
        id="verdicts"
        title="Every verdict"
        intro={
          <p>
            Each row is one run of the checker. Axioms are the logical assumptions a proof rests on; these three are
            Lean&apos;s standard ones. A refutation needs no witness, since its conclusion is false by design.
          </p>
        }
      >
        <Card source={<Source from="verdict_rebuildFromInsertExact" field="statement, proof, accepted, axioms, witness, toolchain (one file per proof)" />} bodyClassName="p-0 sm:p-0">
          <DataTable caption="Checker verdicts against the owner's lock" className="rounded-none border-0">
            <thead>
              <tr>
                <Th>Claim</Th>
                <Th>Proof</Th>
                <Th>Verdict</Th>
                <Th>Axioms</Th>
                <Th>Witness</Th>
              </tr>
            </thead>
            <tbody>
              {proofs.map((p) => (
                <tr key={p.name}>
                  <Td className="min-w-56">
                    <span className="block font-medium text-foreground">{p.title}</span>
                    <code className="block font-mono text-xs text-muted-foreground">{p.verdict.statement}</code>
                  </Td>
                  <Td mono className="text-xs">
                    {p.verdict.proof}
                  </Td>
                  <Td>
                    <AcceptedPill accepted={p.verdict.accepted} />
                  </Td>
                  <Td className="text-xs">{p.verdict.axioms.length ? p.verdict.axioms.join(", ") : "none"}</Td>
                  <Td mono className="text-xs">
                    {p.verdict.witness ?? "not needed"}
                  </Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </Card>
        <p className="mt-3 text-xs text-muted-foreground">Toolchain: {proofs[0]?.verdict.toolchain}</p>
      </ViewSection>

      <ViewSection
        id="statements"
        title="The statements, exactly as locked"
        intro={<p>Cut from the published model as written, with each doc comment. The proofs prove these.</p>}
      >
        <div className="space-y-4">
          {statements().map((s) => (
            <CodeBlock key={s} label={`Spec.Retro.${s}`}>
              {evidence.definition(s)}
            </CodeBlock>
          ))}
          <CodeBlock label="Spec.Retro.forkSyncMatchesRebuild (the claim the refutations refute)">
            {evidence.definition("forkSyncMatchesRebuild")}
          </CodeBlock>
          <Source from="spec" field="def" />
        </div>
      </ViewSection>
    </div>
  );
}
