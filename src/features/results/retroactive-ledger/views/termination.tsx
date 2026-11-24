import { Card, CodeBlock, DataTable, Pill, Td, Th, ViewSection } from "../../ui";
import { nonTerminationFacts, speedStats } from "../derive";
import { speedEvidence } from "../evidence";
import { Source } from "../shared";

const DESCRIBE: Record<string, string> = {
  Disbursal: "Disburse 10",
  Payment: "Pay 5",
};

function describe(activity: string): string {
  const m = activity.match(/^reverse (\d+)$/);
  if (m) return `Reverse activity ${m[1]}`;
  return DESCRIBE[activity] ?? activity;
}

export function TerminationView() {
  const d = speedEvidence.nontermination();
  const f = nonTerminationFacts();
  const s = speedStats();
  const firstEffective = d.events.map((e) => e.effective);

  return (
    <div className="space-y-14">
      <ViewSection
        id="what"
        title="Fork-and-sync doesn't finish on four events"
        intro={
          <div className="space-y-3">
            <p>
              Timing fork-and-sync turned up something worse than a wrong answer. On workloads that mix reversals with
              late activities it didn&apos;t finish: {s.withReversals.workloads - s.withReversals.finished} of{" "}
              {s.withReversals.workloads} ran out of memory or time. Cutting a failing workload down, activity by
              activity, left these {f.events}.
            </p>
            <p>
              The same {f.events} activities were run in three places: the Lean model of the paper&apos;s algorithm, the
              project&apos;s Haskell port, and its Java service. None finishes.
            </p>
          </div>
        }
      >
        <Card source={<Source from={["nontermination", "investigate"]} field="events[]" />} bodyClassName="p-0 sm:p-0">
          <DataTable caption="The four activities, in the order they arrive" className="rounded-none border-0">
            <thead>
              <tr>
                <Th numeric>Arrives</Th>
                <Th>Activity</Th>
                <Th>Effective</Th>
                <Th>Arrives late?</Th>
              </tr>
            </thead>
            <tbody>
              {d.events.map((e, i) => {
                const late = firstEffective.slice(0, i).some((x) => x > e.effective) && !e.activity.startsWith("reverse");
                return (
                  <tr key={e.id}>
                    <Td numeric>{i + 1}</Td>
                    <Td>{describe(e.activity)}</Td>
                    <Td mono>{e.effective}</Td>
                    <Td>{late ? <Pill tone="gold">late</Pill> : null}</Td>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>
        </Card>
      </ViewSection>

      <ViewSection id="where" title="In three places">
        <div className="grid gap-4 lg:grid-cols-3">
          <Card title="The model of the paper" source={<Source from={["modelFuel", "modelFuelLean"]} calc="nonTerminationFacts" />}>
            <p className="text-sm text-pretty text-foreground/85">
              The model gives each arrival a fuel budget for its recursion and reports when it runs out.
            </p>
            <ul className="mt-3 space-y-2 text-sm text-pretty text-foreground/85">
              <li>
                {f.modelStuckAtEveryBound ? "Runs out" : "Does not always run out"} at every budget tried, from{" "}
                {f.fuelMin} to {f.fuelMax}.
              </li>
              <li>{f.prefixesFinish ? "Every shorter prefix finishes" : "A shorter prefix also fails"}: the fourth arrival tips it.</li>
              <li>
                {f.eachIngredientNeeded
                  ? "Take away the reversal, the late disbursal or the late payment, and it finishes."
                  : "It still fails without one of them."}
              </li>
            </ul>
          </Card>
          <Card title="The Haskell port" source={<Source from={["nontermination", "investigate"]} field="haskell.shrunk, haskell.retries" />}>
            <ul className="space-y-2 text-sm text-pretty text-foreground/85">
              <li>
                {f.haskellBothPatterns
                  ? "Runs out of a capped heap, both when the activities are applied one call at a time and in a single call."
                  : "Behaves differently between calling patterns."}
              </li>
              <li>
                {f.haskellRetriesFail
                  ? `Given ${f.haskellRetryLimits.filter((x, i, a) => a.indexOf(x) === i).join(" or ")} seconds, it still runs out of memory instead of finishing.`
                  : "Finishes when given more time."}
              </li>
            </ul>
          </Card>
          <Card title="The Java service" source={<Source from={["nontermination", "javaFour"]} field="java.frames" />}>
            <ul className="space-y-2 text-sm text-pretty text-foreground/85">
              <li>{f.javaStackOverflow ? "Posting the activities fails with java.lang.StackOverflowError." : "No stack overflow recorded."}</li>
              <li>
                The trace repeats the late-activity path and the reversal path, each calling the other, at least{" "}
                {f.javaCycleCount} times.
              </li>
            </ul>
          </Card>
        </div>
      </ViewSection>

      <ViewSection
        id="why"
        title="Why"
        intro={
          <p>
            A late activity is handled by replaying what followed it; a reversal, by replaying what was recorded after
            the activity it reverses. Here the late payment&apos;s replay contains the reversal, and the
            reversal&apos;s replay contains the late payment that is still being processed. Each starts the other
            again.
          </p>
        }
      >
        <Card title="The Java stack trace, by frame" source={<Source from="javaFour" field="frames, by count" />} bodyClassName="p-0 sm:p-0">
          <DataTable caption="Stack frames in the StackOverflowError, by count" className="rounded-none border-0">
            <thead>
              <tr>
                <Th numeric>Times</Th>
                <Th>Frame</Th>
              </tr>
            </thead>
            <tbody>
              {d.java.frames.slice(0, 7).map((fr) => (
                <tr key={fr.line}>
                  <Td numeric>{fr.count}</Td>
                  <Td mono className="text-xs">
                    {fr.frame.replace(/^at /, "")}
                  </Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </Card>
      </ViewSection>

      <ViewSection id="limits" title="What this does and doesn't show">
        <Card>
          <ul className="space-y-3 text-sm text-pretty text-foreground/85">
            <li>
              <strong className="text-foreground">Not a proof of non-termination.</strong> Running out of every budget
              tried, of memory and of stack is consistent with never finishing, but it doesn&apos;t prove it.
            </li>
            <li>
              <strong className="text-foreground">Not the harness.</strong> It happens however the engine is called, and
              the same activities fail in the Lean model and in both implementations. (The Haskell port translates the
              Java service, so those two aren&apos;t independent of each other; the model was written from the paper.)
            </li>
            <li>
              <strong className="text-foreground">Not every workload.</strong> Without reversals, fork-and-sync finished
              every time; it gave a different answer from the rebuild, which is the subject of the counterexamples.
            </li>
          </ul>
        </Card>
        <CodeBlock className="mt-4" label="The model run, as recorded">
          {"forkSync seq4 fuel → stuck:\n" +
            d.model.fuel.map((x) => `  ${x.fuel}: ${x.stuck}`).join("\n")}
        </CodeBlock>
      </ViewSection>
    </div>
  );
}
