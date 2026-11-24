import { fmtInt } from "../../format";
import { Card, CodeBlock, DataTable, Stat, Td, Th, ViewSection } from "../../ui";
import { optimisationTotals, proofResults } from "../derive";
import { evidence } from "../evidence";
import { AcceptedPill, Source } from "../shared";

const STEPS = [
  {
    title: "Find the affected point",
    body: "Where the late event goes in business order, or where the reversed event was.",
  },
  {
    title: "Keep what comes before",
    body: "Those events' effects, and the running balance after them, are unchanged. A ledger already stores both.",
  },
  {
    title: "Re-apply what follows",
    body: "Start from that balance and apply only the late event and what comes after it (or, for a reversal, what came after it).",
  },
];

export function OptimisationView() {
  const o = evidence.optimisation();
  const t = optimisationTotals();
  const proofs = proofResults().filter((p) => p.group === "optimisation");

  return (
    <div className="space-y-14">
      <ViewSection
        id="claim"
        title="Rebuild from the earliest affected point"
        intro={
          <div className="space-y-3">
            <p>
              A full rebuild re-applies every event, and the paper&apos;s fork-and-sync tried to avoid that. A simpler
              saving is enough: when one event arrives late, or one is reversed, nothing before it in business order
              changes. So keep that part, and re-apply only from there.
            </p>
            <p>
              The claim is that this gives <strong className="text-foreground">exactly</strong> the full rebuild: the
              same balance and the same effect for every event. It is stated for an arrival and for a reversal, and
              proved for both.
            </p>
          </div>
        }
      >
        <ol className="grid gap-px overflow-hidden rounded-lg border border-gold/15 bg-gold/15 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex flex-col gap-2 bg-ocean-deep p-4">
              <span className="font-display text-2xl leading-none text-gold/80 tabular-nums">{i + 1}</span>
              <span className="font-semibold text-foreground">{s.title}</span>
              <span className="text-sm text-pretty text-muted-foreground">{s.body}</span>
            </li>
          ))}
        </ol>
      </ViewSection>

      <section aria-label="Optimisation figures" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {proofs.map((p) => (
          <Stat
            key={p.name}
            label={p.name === "rebuildFromInsertExact" ? "Arrival: proved" : "Reversal: proved"}
            value={p.verdict.accepted ? "Exact" : "Not accepted"}
            detail="Accepted by the checker against the owner's lock."
            tone={p.verdict.accepted ? "positive" : "negative"}
          />
        ))}
        <Stat
          label="Tested before proving"
          value={fmtInt(t.tested)}
          detail={`Every sequence of up to three events and every next event; the claim failed on ${fmtInt(t.failures)}.`}
          tone={t.failures === 0 ? "positive" : "negative"}
        />
        <Stat
          label="Wrong versions caught"
          value={`${t.caught} of ${t.variants}`}
          detail="Plausible shortcuts, each run on the same cases. Every one fails somewhere."
          tone={t.caught === t.variants ? "positive" : "negative"}
        />
      </section>

      <ViewSection
        id="tests"
        title="The tests, before the proof"
        intro={<p>Each case is a sequence of up to three events followed by one more: an arrival or a reversal.</p>}
      >
        <Card source={<Source from={["optimisation", "pretest"]} field="arrival_*, reversal_*" />} bodyClassName="p-0 sm:p-0">
          <DataTable caption="Cases the optimisation was tested on" className="rounded-none border-0">
            <thead>
              <tr>
                <Th>Next event</Th>
                <Th numeric>Cases</Th>
                <Th>Of which the interesting ones</Th>
                <Th numeric>Claim failed on</Th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Td className="font-medium text-foreground">An arrival</Td>
                <Td numeric>{fmtInt(o.arrival_cases.value)}</Td>
                <Td>{fmtInt(o.arrival_backdated.value)} arrive late, before an event already there</Td>
                <Td numeric>{fmtInt(o.arrival_claim_fails.value)}</Td>
              </tr>
              <tr>
                <Td className="font-medium text-foreground">A reversal</Td>
                <Td numeric>{fmtInt(o.reversal_cases.value)}</Td>
                <Td>{fmtInt(o.reversal_not_last.value)} reverse an event with others after it</Td>
                <Td numeric>{fmtInt(o.reversal_claim_fails.value)}</Td>
              </tr>
            </tbody>
          </DataTable>
        </Card>
      </ViewSection>

      <ViewSection
        id="bites"
        title="Do the tests bite?"
        intro={
          <p>
            A test that passes no matter what protects nothing. So plausible wrong versions of the step were run on the
            same cases. The last one is the tempting shortcut for a reversal: subtract the event&apos;s own effect and
            leave the rest alone. It is often right, and wrong whenever a later payment&apos;s allocation depended on
            the balance.
          </p>
        }
      >
        <Card source={<Source from={["optimisation", "bite"]} field="variants[]" />} bodyClassName="p-0 sm:p-0">
          <DataTable caption="Wrong versions of the optimised step and how often each fails" className="rounded-none border-0">
            <thead>
              <tr>
                <Th>Case</Th>
                <Th>Wrong version</Th>
                <Th numeric>Fails on</Th>
                <Th numeric>Of cases</Th>
              </tr>
            </thead>
            <tbody>
              {o.variants.map((v) => (
                <tr key={`${v.case}-${v.variant}`}>
                  <Td className="capitalize">{v.case}</Td>
                  <Td>{v.variant}</Td>
                  <Td numeric className={v.fails_on > 0 ? "text-negative" : "text-positive"}>
                    {fmtInt(v.fails_on)}
                  </Td>
                  <Td numeric>{fmtInt(t.casesFor(v.case))}</Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </Card>
      </ViewSection>

      <ViewSection id="statement" title="The exact statements">
        <div className="space-y-4">
          {["rebuildFromInsert", "rebuildFromRemove", "rebuildFromInsertExact", "rebuildFromRemoveExact"].map((name) => (
            <CodeBlock key={name} label={`Spec.Retro.${name}`}>
              {evidence.definition(name)}
            </CodeBlock>
          ))}
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {proofs.map((p) => (
              <span key={p.name} className="inline-flex items-center gap-2">
                <code className="font-mono text-foreground/80">{p.verdict.proof}</code>
                <AcceptedPill accepted={p.verdict.accepted} />
              </span>
            ))}
          </div>
          <Source from="spec" field="def rebuildFrom*" />
        </div>
      </ViewSection>

      <ViewSection id="limits" title="What it doesn't show">
        <Card>
          <ul className="space-y-3 text-sm text-pretty text-foreground/85">
            <li>
              <strong className="text-foreground">Speed.</strong> The step re-applies only the events after the
              affected point, so it does less work than a full rebuild. How much faster that is has not been measured.
            </li>
            <li>
              <strong className="text-foreground">Acceptance.</strong> The claims assume the effect the new event has on
              the live events (it joins them, or the reversed one leaves). They don&apos;t prove that the acceptance
              rules always produce exactly that.
            </li>
            <li>
              <strong className="text-foreground">Audit.</strong> Like the full rebuild, the step recomputes what comes
              after the affected point. Recording that without overwriting earlier entries is up to an implementation.
            </li>
          </ul>
        </Card>
      </ViewSection>
    </div>
  );
}
