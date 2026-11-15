import Link from "next/link";
import { fmt1 } from "../../format";
import { Card, CodeBlock, Pill, Screenshot, Stat, Ticked, ViewSection } from "../../ui";
import { mutationRows, proofCounts, proofRows } from "../derive";
import { Source } from "../shared";

/** The eight checks, in pipeline order, and the mutations that remove each. */
const CHECKS = [
  {
    name: "Spec lock",
    guards: ["M9", "M10", "M11"],
    body: "The spec is the one the owner approved. Without it, an agent could prove a claim by quietly weakening the rule.",
  },
  { name: "Build", guards: ["N8"], body: "The spec and the proofs compile with the pinned Lean version." },
  {
    name: "Statement and proof shape",
    guards: ["M6", "M7", "M8", "N5", "N6", "N7"],
    body: "The statement is a proposition defined in the spec, built only from the spec, and the proof's type is exactly that statement. This stops a proof of something else, or of a weaker copy defined outside the spec.",
  },
  {
    name: "Axioms",
    guards: ["M2", "M3"],
    body: "The proof assumes nothing beyond Lean's three standard axioms. An extra axiom, or sorry, would simply assume the result.",
  },
  {
    name: "No foreign code",
    guards: ["M4", "M5"],
    body: "Nothing is marked unsafe, implemented_by or extern, which would let compiled code differ from what was proved.",
  },
  {
    name: "Vacuity witness",
    guards: ["N1", "N2", "N3", "R1"],
    body: "A separate proof that the claim's assumptions can be met, so it isn't true only because nothing satisfies them. A refutation, a proof of “false”, doesn't need one.",
  },
  {
    name: "Kernel replay",
    guards: ["M1"],
    body: "Lean's kernel re-checks every compiled proof from scratch. This is what caught a forged theorem built with kernel checking switched off, which passed the build and #print axioms.",
  },
  {
    name: "Second kernel",
    guards: ["N4"],
    body: "An independent kernel, con-leche, checks the same proofs, so a single kernel bug isn't enough to fool the pipeline.",
  },
];

export function ProofsView() {
  const counts = proofCounts();
  const rows = proofRows();
  const bites = new Map(mutationRows().map((m) => [m.code, m.bites]));

  return (
    <div className="space-y-14">
      <section aria-label="Proof figures" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat
          label="Claims verified"
          value={`${counts.verified} of ${counts.total}`}
          tone={counts.verified === counts.total ? "positive" : "negative"}
          detail="Accepted by the full pipeline, against the locked spec."
          source={<Source from="prove" field="[].accepted" calc="proofCounts" />}
        />
        <Stat
          label="Spec lock (owner approval)"
          value={<span className="font-mono text-xl">{counts.lock.slice(0, 12)}…</span>}
          detail="SHA-256 of the lock every proof was checked against."
          source={<Source from="prove" field="[].lock_sha256" />}
        />
        <Stat
          label="Toolchain"
          value={<span className="font-mono text-xl">{counts.toolchain.replace("leanprover/lean4:", "Lean ")}</span>}
          detail="Pinned by lean-toolchain in the repository."
          source={<Source from="prove" field="[].toolchain" />}
        />
      </section>

      <ViewSection
        id="checks"
        title="The eight checks"
        intro={
          <p>
            &ldquo;It compiles&rdquo; isn&apos;t &ldquo;it&apos;s true&rdquo;. A claim counts as verified only if its
            proof passes all eight checks, in this order. Each check is guarded by mutations that remove it; the{" "}
            <Link href="/results/gods-hand/rigour" className="text-gold hover:underline">
              Rigour tab
            </Link>{" "}
            shows the code each one changes.
          </p>
        }
      >
        <ol className="grid gap-px overflow-hidden rounded-lg border border-gold/15 bg-gold/15 md:grid-cols-2">
          {CHECKS.map((c, i) => (
            <li key={c.name} className="flex gap-4 bg-ocean-deep p-4">
              <span className="font-display text-2xl leading-none text-gold/80 tabular-nums">{i + 1}</span>
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{c.name}</p>
                <p className="mt-1 text-sm text-pretty text-muted-foreground">{c.body}</p>
                <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  Guarded by
                  {c.guards.map((g) => (
                    <Pill key={g} tone={bites.get(g) ? "positive" : "negative"}>
                      {g} {bites.get(g) ? "bites" : "doesn't bite"}
                    </Pill>
                  ))}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </ViewSection>

      <ViewSection
        id="claims"
        title="Every claim"
        intro={
          <p>
            Open a claim to see its exact Lean statement, quoted from <code className="font-mono text-sm">Spec/Ledger.lean</code>.
            In the spec, <code className="font-mono text-sm">run ops</code> is the ledger after the operations{" "}
            <code className="font-mono text-sm">ops</code>, <code className="font-mono text-sm">outstanding</code> is
            what a bill still owes, <code className="font-mono text-sm">advance</code> is what is left of a payment,
            and <code className="font-mono text-sm">matchUp</code>{" "}
            pairs open bills with advances, oldest bill first.
            &ldquo;Invariant&rdquo; claims hold in every state the ledger can reach.
          </p>
        }
      >
        <Card bodyClassName="p-0 sm:p-0" source={<Source from={["catalog", "prove"]} field="lean_claims[], [] joined by id" calc="proofRows" />}>
          <ul className="divide-y divide-gold/10">
            {rows.map((c) => (
              <li key={c.id}>
                <details className="group">
                  <summary className="flex cursor-pointer list-none flex-wrap items-start gap-x-3 gap-y-1.5 px-4 py-3.5 hover:bg-gold/[0.03] sm:px-5 [&::-webkit-details-marker]:hidden">
                    <span aria-hidden className="mt-0.5 text-gold transition-transform group-open:rotate-90">›</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-mono text-[13px] text-foreground">{c.id}</span>
                      <span className="mt-0.5 block text-sm text-pretty text-muted-foreground">
                        <Ticked text={c.says} />
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Pill>{c.kind}</Pill>
                      {c.result ? (
                        <Pill tone={c.result.accepted ? "positive" : "negative"}>{c.result.accepted ? "✓ Verified" : "✕ Not verified"}</Pill>
                      ) : (
                        <Pill tone="negative">No result</Pill>
                      )}
                    </span>
                  </summary>
                  <div className="grid gap-4 px-4 pb-5 pl-9 sm:px-5 sm:pl-10">
                    <p className="text-sm text-pretty text-foreground/85">
                      <span className="text-muted-foreground">In the spec&apos;s own words: </span>
                      <Ticked text={c.doc} />
                    </p>
                    <CodeBlock label={`Lean statement · Spec/Ledger.lean, lines ${c.spec_lines[0]}–${c.spec_lines[1]}`}>{c.lean}</CodeBlock>
                    {c.result ? (
                      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[max-content_1fr]">
                        <dt className="text-muted-foreground">Proved by</dt>
                        <dd className="font-mono text-[13px] break-all text-foreground/90">{c.proof}</dd>
                        <dt className="text-muted-foreground">Axioms used</dt>
                        <dd className="font-mono text-[13px] text-foreground/90">{c.result.axioms.join(", ") || "none"}</dd>
                        <dt className="text-muted-foreground">Vacuity witness</dt>
                        <dd className="font-mono text-[13px] break-all text-foreground/90">{c.result.witness || "not needed (a refutation)"}</dd>
                        <dt className="text-muted-foreground">Kernel replay of</dt>
                        <dd className="font-mono text-[13px] text-foreground/90">{c.result.replayed_modules.join(", ")}</dd>
                        <dt className="text-muted-foreground">Violations</dt>
                        <dd className="text-foreground/90">{c.result.violations.map((v) => v.code).join(", ") || "none"}</dd>
                        <dt className="text-muted-foreground">Check time</dt>
                        <dd className="text-foreground/90 tabular-nums">{fmt1(c.result.seconds)} s</dd>
                        <dt className="text-muted-foreground">Claim record</dt>
                        <dd className="font-mono text-[13px] break-all text-foreground/90">{c.file}</dd>
                      </dl>
                    ) : null}
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </Card>
      </ViewSection>

      <ViewSection id="terminal" title="The same checks, in the terminal">
        <div className="grid gap-6 lg:grid-cols-2">
          <Screenshot src="/blog/gods-hand/prove-summary.png" alt="Summary of the prove command: all fourteen claims verified" command="docker run --rm -t godshand/checker:dev python -m godshand prove" />
          <Screenshot src="/blog/gods-hand/prove-detail.png" alt="Detail of the prove command for the first claims, listing each check" command="docker run --rm -t godshand/checker:dev python -m godshand prove">
            The detail for each claim, check by check.
          </Screenshot>
          <Screenshot src="/blog/gods-hand/spec-locked.png" alt="The spec command showing the lock created by the owner" command="docker run --rm -t godshand/checker:dev python -m godshand spec">
            The spec, locked by the owner.
          </Screenshot>
          <Screenshot src="/blog/gods-hand/cheats.png" alt="Thirteen attempts to fake a proof, each rejected with the check that caught it" command="docker run --rm -t godshand/checker:dev python -m godshand cheats">
            Attempts to fake a proof, each rejected.
          </Screenshot>
        </div>
      </ViewSection>
    </div>
  );
}
