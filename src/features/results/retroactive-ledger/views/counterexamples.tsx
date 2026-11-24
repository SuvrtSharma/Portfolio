import { Card, DataTable, Pill, Td, Th, ViewSection } from "../../ui";
import { arrivalPosition, codeCases, net } from "../derive";
import { evidence, type Bal, type CodeCase, type Counterexample } from "../evidence";
import { amount, BalCells, COMPONENTS, describeEvent, Source } from "../shared";

/** Which readings of the paper each case relies on, in words. */
const DEPENDS: Record<string, { title: string; body: string[] }> = {
  backdated: {
    title: "A late disbursal, then a payment between them",
    body: [
      "Two readings the paper leaves open: a fork keeps its entries' stored running balances, and the current balance is the last stored one. Both implementations make both choices. With either changed, this case agrees with the rebuild.",
      "It uses no reversal and makes no adjustment entry.",
    ],
  },
  "reading-robust": {
    title: "A late fee between two payments",
    body: [
      "Fails whichever way a fork's balances are read. It does post one adjustment, so it relies on how an adjustment is dated: at its triggering event's recording time, as the paper and both implementations do.",
    ],
  },
  "same-date tie": {
    title: "A disbursal and a payment at the same instant",
    body: [
      "Our rule orders same-date events by id. The paper orders them by arrival and promises nothing else, so this case disagrees with our rule, not with anything the paper claims.",
      "Not run against their code, since there it is not a defect.",
    ],
  },
};

function ArrivalsTable({ c }: { c: Counterexample }) {
  return (
    <DataTable caption={`Arrivals in the ${c.name} case`}>
      <thead>
        <tr>
          <Th numeric>Arrives</Th>
          <Th numeric>Id</Th>
          <Th numeric>Business day</Th>
          <Th>Event</Th>
        </tr>
      </thead>
      <tbody>
        {c.arrivals.map((e, i) => (
          <tr key={e.id}>
            <Td numeric>{i + 1}</Td>
            <Td numeric>{e.id}</Td>
            <Td numeric>{e.day}</Td>
            <Td>{describeEvent(e.event)}</Td>
          </tr>
        ))}
      </tbody>
    </DataTable>
  );
}

function ModelTable({ c }: { c: Counterexample }) {
  const effect = (s: Counterexample["rebuild"], id: number) => s.effects.find((x) => x.id === id)?.effect;
  return (
    <DataTable caption={`Model results in the ${c.name} case`}>
      <thead>
        <tr>
          <Th />
          <Th />
          {COMPONENTS.map((k) => (
            <Th key={k} numeric>
              {k}
            </Th>
          ))}
          <Th numeric>Net owed</Th>
        </tr>
      </thead>
      <tbody>
        {(["rebuild", "forkSync"] as const).map((which) => (
          <tr key={which}>
            <Td className="font-medium text-foreground">{which === "rebuild" ? "Full rebuild" : "Fork-and-sync"}</Td>
            <Td className="text-xs text-muted-foreground">final balance</Td>
            <BalCells bal={c[which].balance} other={which === "forkSync" ? c.rebuild.balance : undefined} />
            <Td numeric>{amount(net(c[which].balance))}</Td>
          </tr>
        ))}
        {c.arrivals.map((e) => {
          const r = effect(c.rebuild, e.id);
          const f = effect(c.forkSync, e.id);
          if (!r || !f) return null;
          return (["rebuild", "forkSync"] as const).map((which) => (
            <tr key={`${e.id}-${which}`}>
              <Td className="text-muted-foreground">{which === "rebuild" ? "Full rebuild" : "Fork-and-sync"}</Td>
              <Td className="text-xs text-muted-foreground">effect of event {e.id}</Td>
              <BalCells bal={which === "rebuild" ? r : f} other={which === "forkSync" ? r : undefined} />
              <Td />
            </tr>
          ));
        })}
      </tbody>
    </DataTable>
  );
}

function CodeTable({ runs }: { runs: CodeCase[] }) {
  const effectAt = (s: CodeCase["arrival"], c: CodeCase, pos: number): Bal | undefined =>
    s.effects.find((x) => arrivalPosition(c, x.id) === pos)?.effect;
  return (
    <DataTable caption="Their code: the late path against an on-time run">
      <thead>
        <tr>
          <Th>Implementation</Th>
          <Th />
          {COMPONENTS.map((k) => (
            <Th key={k} numeric>
              {k}
            </Th>
          ))}
          <Th>Late path matches on time?</Th>
        </tr>
      </thead>
      <tbody>
        {runs.map((c) => {
          const positions = [1, 2, 3];
          const rows: { label: string; late?: Bal; onTime?: Bal }[] = [
            { label: "final balance", late: c.arrival.balance, onTime: c.on_time.balance },
            ...positions.map((p) => ({
              label: `effect of event ${p}`,
              late: effectAt(c.arrival, c, p),
              onTime: effectAt(c.on_time, c, p),
            })),
          ];
          return rows.flatMap((row, i) =>
            row.late && row.onTime
              ? [
                  <tr key={`${c.implementation}-${i}-late`}>
                    <Td className="font-medium text-foreground">{i === 0 ? c.implementation : ""}</Td>
                    <Td className="text-xs text-muted-foreground">{row.label}, late</Td>
                    <BalCells bal={row.late} other={row.onTime} />
                    <Td>
                      {i === 0 ? (
                        <Pill tone={c.late_path_agrees_with_on_time ? "positive" : "negative"}>
                          {c.late_path_agrees_with_on_time ? "yes" : c.balance_agrees ? "balance only" : "no"}
                        </Pill>
                      ) : null}
                    </Td>
                  </tr>,
                  <tr key={`${c.implementation}-${i}-on`}>
                    <Td />
                    <Td className="text-xs text-muted-foreground">{row.label}, on time</Td>
                    <BalCells bal={row.onTime} />
                    <Td />
                  </tr>,
                ]
              : [],
          );
        })}
      </tbody>
    </DataTable>
  );
}

export function CounterexamplesView() {
  const cases = evidence.counterexamples().cases;
  return (
    <div className="space-y-14">
      <ViewSection
        id="about"
        title="Three ways fork-and-sync ends somewhere else"
        intro={
          <p>
            Each case is a short sequence of events, given in the order they arrive. The full rebuild applies them in
            business order; the model of fork-and-sync processes them as they arrive, as the paper describes. Both
            columns come from evaluating the locked model; figures in red differ from the rebuild. Amounts are in the
            model&apos;s minor units.
          </p>
        }
      >
        {null}
      </ViewSection>

      {cases.map((c) => {
        const d = DEPENDS[c.name];
        const runs = codeCases(c.name);
        return (
          <ViewSection key={c.name} id={c.name.replace(/\s+/g, "-")} title={d?.title ?? c.name}>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
              <Card title="Arrivals" source={<Source from="counterexamples" field={`cases[name=${c.name}].arrivals`} />}>
                <ArrivalsTable c={c} />
                <div className="mt-4 space-y-2 text-sm text-pretty text-foreground/80">
                  {d?.body.map((b) => (
                    <p key={b}>{b}</p>
                  ))}
                  <p className="text-xs text-muted-foreground">
                    Lean: <code className="font-mono">{c.lean}</code>; fork-and-sync posted {c.adjustments} adjustment
                    {c.adjustments === 1 ? "" : "s"} and{" "}
                    {c.forkSyncStuck ? "ran out of fuel" : "finished"}.
                  </p>
                </div>
              </Card>
              <Card
                title="In the model"
                source={<Source from="counterexamples" field={`cases[name=${c.name}].rebuild, .forkSync`} calc="net" />}
              >
                <ModelTable c={c} />
              </Card>
            </div>
            {runs.length ? (
              <Card
                className="mt-4"
                title="In their code"
                description={
                  <span>
                    Precise Ledger Pro at upstream commit 06bb4ce. Each run compares the late path with the same engine
                    given the events on time, so differences in their allocation rules cancel out.
                    {c.name === "backdated"
                      ? " Their code also lets a later disbursal use up excess, which our model doesn't, so their on-time balance differs from the model's rebuild; the payment's effect is what to compare."
                      : ""}
                  </span>
                }
                source={<Source from={["codeRepro", c.name === "backdated" ? "haskell1118" : "haskell1123", "javaExtract"]} field={`cases[case=${c.name}]`} calc="arrivalPosition" />}
              >
                <CodeTable runs={runs} />
              </Card>
            ) : null}
          </ViewSection>
        );
      })}
    </div>
  );
}
