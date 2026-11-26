import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PostCard } from "@/features/blog/post-card";
import { getDataProvider } from "@/lib/data";
import type { HeadlineFigure } from "../../types";
import { fmt1, fmtInt, fmtRatio } from "../../format";
import { Card, DataTable, Definitions, Stat, Td, Th, ViewSection } from "../../ui";
import { configSummaries, counterexampleComparison, mutationCounts, proofCounts, requestTotals, verdictCounts } from "../derive";
import { evidence } from "../evidence";
import { CallPill, Source, VerdictPill } from "../shared";

const STEPS = [
  {
    title: "The claim",
    body: "The agent states what it changes and which guarantees it gives up. Each claim is a typed record, not a sentence in a chat.",
  },
  {
    title: "Guarantee check",
    body: "The checker opens a live database with the change applied and reads its real settings. A guarantee lost without being declared rejects the claim.",
  },
  {
    title: "Lean proof",
    body: "A claim that gives up a guarantee needs a proof, in Lean 4, that the ledger's rules still hold. Lean checks every step of a mathematical proof.",
  },
  {
    title: "Conformance",
    body: "The real code and a runnable copy of the spec process the same random operations and must give the same answer every time.",
  },
  {
    title: "Only then, timing",
    body: "Accepted claims are timed in interleaved rounds, against a baseline that is measured again in every round.",
  },
];

const GLOSSARY = [
  ["Claim", "A statement an agent makes about the code that can be checked or measured, such as “this index is safe and faster”."],
  ["Guarantee", "Something the platform provides that the ledger's rules rely on. For example, a committed payment survives a power cut."],
  ["Spec", "The ledger's rules written in Lean: what bills, payments and settlement are, and what must always hold. The owner reviews and locks it."],
  ["Spec lock", "SHA-256 fingerprints of the spec. If anyone, the agent included, changes one character, every proof is rejected until the owner approves again."],
  ["Kernel", "The small core of a proof checker that every proof is finally checked by. Two independent kernels are used: Lean's own and con-leche."],
  ["Vacuity witness", "A proof that a claim's assumptions can be met. “Every unicorn is green” is true only because there are none; the witness rules that out."],
  ["Conformance", "Running the real code and the compiled spec on the same random operations and comparing every answer."],
  ["Shrinker", "Cuts a failing sequence of operations down to the shortest one that still fails, so a person can read it."],
  ["Mutation, bites", "A mutation breaks one check on purpose. A test bites if it then fails. A check whose tests still pass when it is broken protects nothing."],
  ["WAL, synchronous", "SQLite's journal mode and how often it waits for the disk. Faster settings can lose recent commits on a power cut."],
  ["p50, p99", "Latency percentiles: half, or 99%, of requests finished within this time. Nearest rank over every request, no sampling."],
  ["Round", "One pass that runs every configuration once, in a shuffled order. Rounds show how much results drift on their own."],
] as const;

export function OverviewView({ figures }: { figures: HeadlineFigure[] }) {
  const data = getDataProvider();
  const set = data.getResultSetBySlug("gods-hand");
  const posts = (set?.posts ?? []).map((slug) => data.getPostBySlug(slug)).filter((p) => p !== undefined);
  const configs = configSummaries().filter((c) => c.role === "accept" || c.role === "reject");
  const verdicts = evidence.verdicts().verdicts;
  const ce = counterexampleComparison();
  const totals = requestTotals();
  const all = configSummaries().find((c) => c.label === "ALL-ACCEPTED");
  const noise = configs.filter((c) => c.role === "accept" && c.call === "noise").length;
  const proofs = proofCounts();
  const muts = mutationCounts();

  const vc = verdictCounts();
  const minute = [
    {
      term: "Goal",
      detail: "Find out whether a tool can tell if an AI agent's claim that a change is “safe and faster” is true, before anyone believes it.",
    },
    {
      term: "Tested on",
      detail: `A small billing system an AI agent built (bills, payments, advance payments and reversals), and the ${vc.total} speed-ups the agent then proposed for it.`,
    },
    {
      term: "What was done",
      detail:
        "The rules the system must always keep were written down, reviewed by a person and locked. Each change was checked against those rules first: by a proof checker, by reading the live database's settings, and by running the real code against the rules on random input. Only the changes that passed were timed.",
    },
    {
      term: "Result",
      detail: `${vc.accepted} of ${vc.total} changes were safe${all ? `, and together they made the system ${fmtRatio(all.ratio)} faster` : ""}. The ${vc.total - vc.accepted} rejected ones look fine in everyday use: one breaks only once a customer has more than 20 unpaid bills, and the other passed every functional test but can lose confirmed payments in a power cut.`,
    },
    {
      term: "Conclusion",
      detail:
        "The checker catches wrong claims that ordinary tests miss. It doesn't replace a person: someone who knows the business still has to review the rules.",
    },
  ];

  return (
    <div className="space-y-14">
      <ViewSection id="minute" title="In one minute">
        <Card>
          <Definitions items={minute} />
          <p className="mt-4 text-sm text-muted-foreground">
            New to this?{" "}
            <Link href="/blog/ai-agents-prove-it-plain-english" className="text-gold hover:underline">
              Read the plain-English version
            </Link>
            . The rest of this page is the detail, with every figure traced to its raw file.
          </p>
        </Card>
      </ViewSection>

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
              An AI agent built a small ledger API (parties, dated bills, payments, advances and reversals) and then
              proposed six changes to make it faster. Agents state claims like &ldquo;this is safe&rdquo; with
              confidence, and some of those claims are wrong. Here, no claim is believed until a tool has produced
              evidence for it.
            </p>
            <p>
              Each claim is split in two. <strong className="text-foreground">Meaning</strong>: does the system still
              give the right answers and keep its rules? That can be checked, with proof and by comparing the code
              with a model. <strong className="text-foreground">Speed</strong>: is it faster? That can only be
              measured, and measurement is noisy. Meaning is judged first, without any timing, and a change that breaks
              a rule is rejected however fast it is.
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
        title="The six optimisation claims"
        intro={
          <p>
            Meaning was decided first, on a live database, in Lean and against the spec. Speed is the median of three
            interleaved rounds, called faster only when the slowest round beat the baseline&apos;s fastest.
          </p>
        }
      >
        <Card source={<Source from={["verdicts", "benchmark"]} field="verdicts[].verdict, runs[].reps[].overall.throughput_rps" calc="configSummaries" />} bodyClassName="p-0 sm:p-0">
          <DataTable caption="The six optimisation claims with their verdicts and speed" className="rounded-none border-0">
            <thead>
              <tr>
                <Th>Claim</Th>
                <Th>Meaning</Th>
                <Th numeric>× baseline</Th>
                <Th>Speed</Th>
              </tr>
            </thead>
            <tbody>
              {configs.map((c) => {
                const v = verdicts.find((x) => x.id === c.label);
                return (
                  <tr key={c.label}>
                    <Td className="min-w-64">
                      <span className="block font-medium text-foreground">{c.name}</span>
                      <span className="block text-xs text-muted-foreground">{v?.agent_says}</span>
                    </Td>
                    <Td>{v ? <VerdictPill verdict={v.verdict} /> : null}</Td>
                    <Td numeric>{fmtRatio(c.ratio)}</Td>
                    <Td>
                      <CallPill call={c.call} />
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>
        </Card>
        <p className="mt-3 text-sm text-muted-foreground">
          Rejected claims were timed only to show what speed was on offer. They are not part of the accepted set.{" "}
          <Link href="/results/gods-hand/meaning" className="text-gold hover:underline">
            Why each was judged as it was
          </Link>
        </p>
      </ViewSection>

      <ViewSection id="shows" title="What this run shows">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="What held">
            <ul className="space-y-3 text-sm text-pretty text-foreground/85">
              <li>
                <strong className="text-foreground">The proofs hold, and the checker can fail.</strong>{" "}
                {proofs.verified} of {proofs.total} Lean claims passed every check, and {muts.bit} of {muts.total}{" "}
                deliberate breakages of the checker were caught by its tests.
              </li>
              <li>
                <strong className="text-foreground">Wrong claims were caught before timing.</strong> The capped bill
                scan was refuted in Lean and by conformance
                {ce ? (
                  <>
                    , and the shrinker cut its failure to {fmtInt(ce.ops.length)} operations
                  </>
                ) : null}
                . WAL with synchronous=NORMAL gave perfect answers but quietly gave up durability.
              </li>
              <li>
                <strong className="text-foreground">The speed-up is real.</strong> The accepted set ran at{" "}
                {all ? fmtRatio(all.ratio) : "—"}{" "}
                the baseline&apos;s median, and even its slowest round (
                {all ? fmt1(all.min) : "—"} req/s) beat the baseline&apos;s fastest. No request failed out of{" "}
                {fmtInt(totals.requests)}.
              </li>
            </ul>
          </Card>
          <Card title="What it doesn't show">
            <ul className="space-y-3 text-sm text-pretty text-foreground/85">
              <li>
                <strong className="text-foreground">It doesn&apos;t prove the SQL.</strong>{" "}
                The proofs are about the
                spec. Conformance compares the code with the spec on samples, which finds bugs but can&apos;t rule
                them out.
              </li>
              <li>
                <strong className="text-foreground">Some speed results are no result.</strong> On their own,{" "}
                {noise}{" "}
                of the accepted changes stayed inside this machine&apos;s noise, because its disk stalls
                writes for seconds at a time. They are reported as that, not as slower.
              </li>
              <li>
                <strong className="text-foreground">One laptop, one VM, one ledger the agent wrote.</strong>{" "}
                The
                measurements expire, and the agent wrote both the spec and the code. The next run uses a ledger it
                didn&apos;t write.
              </li>
            </ul>
          </Card>
        </div>
      </ViewSection>

      {posts.length ? (
        <ViewSection id="write-ups" title="The write-ups">
          <ul className="grid gap-4 lg:grid-cols-2">
            {posts.map((post) => (
              <li key={post.slug}>
                <PostCard post={post} />
              </li>
            ))}
          </ul>
        </ViewSection>
      ) : null}

      <ViewSection id="glossary" title="Words used on this dashboard">
        <Card>
          <Definitions items={GLOSSARY.map(([term, detail]) => ({ term, detail }))} />
        </Card>
        <p className="mt-4 text-sm text-muted-foreground">
          Every figure on this dashboard is read from the run&apos;s evidence files when the site is built.{" "}
          <Link href="/results/gods-hand/method" className="inline-flex items-center gap-1 text-gold hover:underline">
            How each number was made <ArrowRight className="size-3.5" />
          </Link>
        </p>
      </ViewSection>
    </div>
  );
}
