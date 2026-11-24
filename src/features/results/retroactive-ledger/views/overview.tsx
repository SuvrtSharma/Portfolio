import Link from "next/link";
import type { HeadlineFigure } from "../../types";
import { fmtInt, fmtRatio } from "../../format";
import { Card, DataTable, Definitions, Pill, Stat, Td, Th, ViewSection } from "../../ui";
import {
  counterexampleFacts,
  nonTerminationFacts,
  optimisationTotals,
  proofCounts,
  proofResults,
  reproductionFacts,
  speedStats,
  type ClaimGroup,
} from "../derive";
import { AcceptedPill, Source, VIEW } from "../shared";

const STEPS = [
  {
    title: "Rules from outside",
    body: "What a production ledger must do, taken from published practice and regulation, not from the code being checked.",
  },
  {
    title: "A model in Lean",
    body: "The paper's fork-and-sync, and a full rebuild in business order as the oracle. The owner reviews the model and locks it.",
  },
  {
    title: "Proofs, checked",
    body: "Each claim is a Lean theorem, accepted only by a checker with two independent kernels and a test that its assumptions can hold.",
  },
  {
    title: "Back to their code",
    body: "Each counterexample is run through the project's own Haskell port and Java service, against an on-time run of the same engine.",
  },
  {
    title: "A safe optimisation",
    body: "A cheaper way to rebuild, proved to give exactly the full rebuild, then timed in their own code.",
  },
];

const GROUP_LABEL: Record<ClaimGroup, string> = {
  optimisation: "Optimisation",
  refutation: "Refutation",
  property: "Property",
};

const GLOSSARY = [
  ["Retroactive event", "An event that arrives after later-dated ones are already on the ledger: a payment recorded late, or a reversal of an earlier event."],
  ["Business order", "Events ordered by the date they take effect, not by when they arrived. The correct ledger is the one on-time processing would give."],
  ["Full rebuild", "Re-apply every live event in business order from an empty ledger. Correct by construction, and costly: the paper's reason for fork-and-sync."],
  ["Fork-and-sync", "The paper's alternative: fork the ledger at the late event's date, replay what follows, and post adjustments for any difference."],
  ["Spec lock", "SHA-256 fingerprints of the Lean model. Change one character and every proof is rejected until the owner reviews it again."],
  ["Counterexample", "One concrete case where a claim fails. One that terminates is enough to disprove an “always”."],
  ["Vacuity witness", "A proof that a claim's assumptions can be met, so the claim isn't true merely because nothing satisfies them."],
  ["Bites", "A test bites if it fails when the thing it protects is broken. Here, plausible wrong optimisations must fail."],
] as const;

export function OverviewView({ figures }: { figures: HeadlineFigure[] }) {
  const proofs = proofResults();
  const counts = proofCounts();
  const opt = optimisationTotals();
  const sp = speedStats();
  const nt = nonTerminationFacts();
  const facts = counterexampleFacts();
  const repro = reproductionFacts();
  const robustHaskell = repro.find((r) => r.case === "reading-robust" && r.implementation === "Haskell port");
  const robustJava = repro.find((r) => r.case === "reading-robust" && r.implementation === "Java service");

  return (
    <div className="space-y-14">
      <section aria-label="Headline figures" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {figures.map((f) => (
          <Stat key={f.label} label={f.label} value={f.value} detail={f.detail} tone={f.tone} />
        ))}
      </section>

      <ViewSection
        id="what"
        title="What this is"
        intro={
          <div className="space-y-3">
            <p>
              Part 1 checked a ledger an AI agent wrote. This part checks one it didn&apos;t: Precise Ledger Pro, an
              open-source loan ledger with a Java service, a Haskell port, and a draft paper describing
              <strong className="text-foreground"> fork-and-sync</strong>, a way to correct the ledger when an event
              arrives late without rebuilding it from scratch.
            </p>
            <p>
              Fork-and-sync is itself an optimisation claim: the paper calls a full rebuild correct but costly. So the
              same question applies as in part 1. Does the optimisation keep its meaning? And if not, is there one that
              does?
            </p>
          </div>
        }
      >
        <ol className="grid gap-px overflow-hidden rounded-lg border border-gold/15 bg-gold/15 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex flex-col gap-2 bg-ocean-deep p-4">
              <span className="font-display text-2xl leading-none text-gold/80 tabular-nums">{i + 1}</span>
              <span className="font-semibold text-foreground">{s.title}</span>
              <span className="text-sm text-pretty text-muted-foreground">{s.body}</span>
            </li>
          ))}
        </ol>
      </ViewSection>

      <ViewSection
        id="claims"
        title={`The ${counts.total} checked proofs`}
        intro={
          <p>
            Every proof below was accepted by the project&apos;s checker against the owner&apos;s lock of the model.
            The refutations are proofs too: each proves that fork-and-sync, as modelled, does not always end where a
            full rebuild does.
          </p>
        }
      >
        <Card
          source={<Source from={["verdict_rebuildFromInsertExact", "verdict_paymentConserved"]} field="accepted (one file per proof)" calc="proofResults" />}
          bodyClassName="p-0 sm:p-0"
        >
          <DataTable caption="The checked proofs and their verdicts" className="rounded-none border-0">
            <thead>
              <tr>
                <Th>Claim</Th>
                <Th>Kind</Th>
                <Th>Checker</Th>
              </tr>
            </thead>
            <tbody>
              {proofs.map((p) => (
                <tr key={p.name}>
                  <Td className="min-w-72">
                    <span className="block font-medium text-foreground">{p.title}</span>
                    <span className="block text-xs text-pretty text-muted-foreground">{p.plain}</span>
                  </Td>
                  <Td>
                    <Pill tone={p.group === "refutation" ? "negative" : p.group === "optimisation" ? "gold" : "neutral"}>
                      {GROUP_LABEL[p.group]}
                    </Pill>
                  </Td>
                  <Td>
                    <AcceptedPill accepted={p.verdict.accepted} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </Card>
        <p className="mt-3 text-sm text-muted-foreground">
          <Link href={VIEW("counterexamples")} className="text-gold hover:underline">
            The counterexamples, in the model and in their code
          </Link>{" "}
          ·{" "}
          <Link href={VIEW("proofs")} className="text-gold hover:underline">
            Each claim&apos;s exact Lean statement
          </Link>
        </p>
      </ViewSection>

      <ViewSection id="shows" title="What this shows">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="What held">
            <ul className="space-y-3 text-sm text-pretty text-foreground/85">
              <li>
                <strong className="text-foreground">The paper&apos;s optimisation doesn&apos;t keep its meaning, as modelled.</strong>{" "}
                {counts.refutationsAccepted} counterexamples are proved, each a short sequence of events on which
                fork-and-sync and a full rebuild end in different states.{" "}
                {facts.every((f) => f.netAgrees)
                  ? "In every one the net position agrees; what differs is how it is split between fee, principal and excess."
                  : "In some of them even the net position differs."}
              </li>
              <li>
                <strong className="text-foreground">The cases show up in their code.</strong>{" "}
                {repro.filter((r) => r.disagrees).length} of {repro.length} runs of their code disagree with an on-time
                run of the same engine.
                {robustHaskell?.lateBalanceMatchesModel
                  ? " For the reading-robust case the Haskell port ends with exactly the model's wrong balance."
                  : ""}
                {robustJava?.balanceAgrees && robustJava.disagrees
                  ? " The Java service reports the right balance there, but books the last payment's effect wrongly."
                  : ""}
              </li>
              <li>
                <strong className="text-foreground">A cheaper rebuild that keeps its meaning.</strong> Rebuilding only
                from the earliest affected point is proved to give exactly the full rebuild, for an arrival and for a
                reversal. It was tested on {fmtInt(opt.tested)} cases first, and {opt.caught} of {opt.variants}{" "}
                plausible wrong versions fail. In their own code it is faster than a full rebuild on {sp.faster} of{" "}
                {sp.workloads} workloads, by a median of {fmtRatio(sp.ratioMedian)}.
              </li>
              <li>
                <strong className="text-foreground">Fork-and-sync can fail to finish.</strong> On{" "}
                {sp.withReversals.workloads - sp.withReversals.finished} of {sp.withReversals.workloads} workloads with
                reversals it ran out of memory or time, down to a case of {nt.events} activities that the model of the
                paper, the Haskell port and the Java service all fail to finish.{" "}
                <Link href={VIEW("termination")} className="text-gold hover:underline">
                  Why
                </Link>
              </li>
            </ul>
          </Card>
          <Card title="What it doesn't show">
            <ul className="space-y-3 text-sm text-pretty text-foreground/85">
              <li>
                <strong className="text-foreground">Speed in general.</strong> The timings are from one laptop, on their
                list-based ledger, whose own costs set the absolute times. They expire, and the fork-and-sync finding is
                not a proof that it never finishes.
              </li>
              <li>
                <strong className="text-foreground">The proofs are about the model.</strong> Attributing a
                counterexample to the paper rests on a step-by-step mapping from its Appendix C to the model, and on
                readings the paper leaves open, set out in the{" "}
                <a href={`/results/retroactive-ledger/docs/part2/paper-model-mapping.md`} className="text-gold hover:underline">
                  mapping
                </a>
                .
              </li>
              <li>
                <strong className="text-foreground">A narrow model.</strong> Fixed amounts, one currency, no interest
                yet. The tie case disagrees only with our own rule for same-date events. The optimisation&apos;s claims
                assume the effect an arrival or reversal has on the live events, rather than proving it from the
                acceptance rules.
              </li>
            </ul>
          </Card>
        </div>
      </ViewSection>

      <ViewSection id="glossary" title="Terms used here">
        <Card>
          <Definitions items={GLOSSARY.map(([term, detail]) => ({ term, detail }))} />
        </Card>
      </ViewSection>
    </div>
  );
}
