import { fmt1, fmtInt } from "../../format";
import { Card, CodeBlock, DataTable, Pill, Screenshot, Stat, Td, Th, ViewSection } from "../../ui";
import { counterexampleComparison, shortName, verdictCounts } from "../derive";
import { evidence } from "../evidence";
import { REASONS, Source, VerdictPill } from "../shared";

const show = (v: unknown) => (typeof v === "string" ? v : JSON.stringify(v, null, 1));

export function MeaningView() {
  const v = evidence.verdicts();
  const catalog = evidence.catalog().optimisations;
  const counts = verdictCounts();
  const ce = counterexampleComparison();
  const sequences = v.verdicts[0]?.evidence.conformance.sequences ?? 0;
  const seed = v.verdicts[0]?.evidence.conformance.seed;

  return (
    <div className="space-y-14">
      <section aria-label="Meaning figures" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat
          label="Claims accepted"
          value={`${counts.accepted} of ${counts.total}`}
          detail="Decided with no timing involved."
          source={<Source from="verdicts" field="verdicts[].verdict" calc="verdictCounts" />}
        />
        <Stat
          label="Spec locked during the check"
          value={v.spec_locked ? "Yes" : "No"}
          tone={v.spec_locked ? "positive" : "negative"}
          detail="Lean evidence counts only against the owner's locked spec."
          source={<Source from="verdicts" field="spec_locked" />}
        />
        <Stat
          label="Random sequences per claim"
          value={fmtInt(sequences)}
          detail={`Generated from seed ${seed}, so every claim saw the same operations.`}
          source={<Source from="verdicts" field="verdicts[].evidence.conformance" />}
        />
      </section>

      <ViewSection
        id="verdicts"
        title="Verdict on each claim"
        intro={
          <p>
            Three independent questions, all answered before any timing: what the live database really guarantees
            with the change applied, whether a Lean proof covers any guarantee it gives up, and whether the real code
            still agrees with the compiled spec.
          </p>
        }
      >
        <Card bodyClassName="p-0 sm:p-0" source={<Source from="verdicts" field="verdicts[]" />}>
          <DataTable caption="Meaning verdict on each optimisation claim">
            <thead>
              <tr>
                <Th>Claim</Th>
                <Th>Verdict</Th>
                <Th>Reasons</Th>
                <Th numeric>Operations compared</Th>
                <Th numeric>Sequences that disagreed</Th>
                <Th>Durable commit, observed</Th>
              </tr>
            </thead>
            <tbody>
              {v.verdicts.map((x) => {
                const cand = x.evidence.observed.candidate;
                return (
                  <tr key={x.id}>
                    <Td className="min-w-56">
                      <span className="block font-medium text-foreground">{shortName(x.id)}</span>
                      <span className="block text-xs text-muted-foreground">{x.kind}</span>
                    </Td>
                    <Td>
                      <VerdictPill verdict={x.verdict} />
                    </Td>
                    <Td className="min-w-48">
                      {x.reasons.length ? (
                        <ul className="space-y-1">
                          {x.reasons.map((r) => (
                            <li key={r.code} className="font-mono text-xs text-negative">
                              {r.code}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-muted-foreground">none</span>
                      )}
                    </Td>
                    <Td numeric>{fmtInt(x.evidence.conformance.operations)}</Td>
                    <Td numeric className={x.evidence.conformance.mismatches ? "text-negative" : undefined}>
                      {fmtInt(x.evidence.conformance.mismatches)}
                    </Td>
                    <Td className="whitespace-nowrap">
                      <span className={cand.held["sqlite.durable_commit"] ? "text-positive" : "text-negative"}>
                        {cand.held["sqlite.durable_commit"] ? "✓ Yes" : "✕ No"}
                      </span>
                      <span className="block font-mono text-xs text-muted-foreground">
                        {String(cand.pragmas.journal_mode)}, synchronous {String(cand.pragmas.synchronous)}
                      </span>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>
        </Card>
        <p className="mt-3 text-sm text-muted-foreground">
          A sequence stops at its first disagreement, so a claim that disagrees is compared on fewer operations.
          SQLite reports synchronous as a number: 1 is NORMAL, 2 is FULL and 3 is EXTRA (
          <a href="https://www.sqlite.org/pragma.html#pragma_synchronous" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
            SQLite documentation
          </a>
          ).
        </p>
      </ViewSection>

      <ViewSection id="in-full" title="Each claim in full" intro={<p>Everything the checker used to reach each verdict.</p>}>
        <Card bodyClassName="p-0 sm:p-0" source={<Source from={["verdicts", "catalog"]} field="verdicts[], optimisations[] joined by id" />}>
          <ul className="divide-y divide-gold/10">
            {v.verdicts.map((x) => {
              const c = catalog.find((o) => o.id === x.id);
              const conf = x.evidence.conformance;
              return (
                <li key={x.id}>
                  <details className="group">
                    <summary className="flex cursor-pointer list-none flex-wrap items-start gap-x-3 gap-y-1.5 px-4 py-3.5 hover:bg-gold/[0.03] sm:px-5 [&::-webkit-details-marker]:hidden">
                      <span aria-hidden className="mt-0.5 text-gold transition-transform group-open:rotate-90">›</span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-foreground">{x.title}</span>
                        <span className="mt-0.5 block font-mono text-xs text-muted-foreground">{x.id}</span>
                      </span>
                      <VerdictPill verdict={x.verdict} />
                    </summary>
                    <div className="grid gap-5 px-4 pb-5 pl-9 sm:px-5 sm:pl-10">
                      <blockquote className="border-l-2 border-gold/40 pl-3 text-sm text-pretty text-foreground/85 italic">
                        &ldquo;{x.agent_says}&rdquo;
                        <span className="mt-1 block text-xs text-muted-foreground not-italic">What the agent said</span>
                      </blockquote>

                      <div className="grid gap-4 md:grid-cols-2">
                        <CodeBlock label="Settings it changes">{show(x.config)}</CodeBlock>
                        <div>
                          <p className="mb-1.5 text-xs text-muted-foreground">Guarantees it declared it gives up</p>
                          <p className="text-sm text-foreground/90">
                            {x.declared_drops.length ? x.declared_drops.map((d) => <code key={d} className="mr-2 font-mono text-[13px]">{d}</code>) : "None"}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="mb-1.5 text-xs text-muted-foreground">Database settings, read from a live database</p>
                        <DataTable caption={`Observed settings for ${x.id}`}>
                          <thead>
                            <tr>
                              <Th>Setting</Th>
                              <Th>Baseline</Th>
                              <Th>With the change</Th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.keys(x.evidence.observed.candidate.pragmas).map((k) => (
                              <tr key={k}>
                                <Td mono>{k}</Td>
                                <Td mono>{String(x.evidence.observed.baseline.pragmas[k])}</Td>
                                <Td mono>{String(x.evidence.observed.candidate.pragmas[k])}</Td>
                              </tr>
                            ))}
                            {Object.keys(x.evidence.observed.candidate.held).map((k) => (
                              <tr key={k}>
                                <Td mono>{k}</Td>
                                <Td mono>{String(x.evidence.observed.baseline.held[k])}</Td>
                                <Td mono className={x.evidence.observed.candidate.held[k] ? "text-positive" : "text-negative"}>
                                  {String(x.evidence.observed.candidate.held[k])}
                                </Td>
                              </tr>
                            ))}
                          </tbody>
                        </DataTable>
                      </div>

                      {c && c.compensated_by.length ? (
                        <div className="grid gap-3">
                          {c.compensated_by.map((cb) => (
                            <CodeBlock key={cb.statement} label={`Lean statement it relies on, for rule ${cb.rule}`}>
                              {cb.lean || cb.statement}
                            </CodeBlock>
                          ))}
                        </div>
                      ) : null}

                      {x.evidence.compensations?.length ? (
                        <div>
                          <p className="mb-1.5 text-xs text-muted-foreground">Lean results</p>
                          <ul className="space-y-1.5 text-sm">
                            {x.evidence.compensations.map((l) => (
                              <li key={l.statement} className="flex flex-wrap items-center gap-2">
                                <code className="font-mono text-[13px] text-foreground/90">{l.statement}</code>
                                <Pill tone={l.accepted ? "positive" : "negative"}>{l.accepted ? "✓ Proved" : "✕ Not proved"}</Pill>
                                {l.violations.length ? <span className="font-mono text-xs text-muted-foreground">{l.violations.join(", ")}</span> : null}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      <div>
                        <p className="mb-1.5 text-xs text-muted-foreground">Conformance against the compiled spec</p>
                        <p className="text-sm text-foreground/90">
                          {fmtInt(conf.sequences)} sequences, {fmtInt(conf.operations)} operations, seed {conf.seed}.{" "}
                          <span className={conf.mismatches ? "text-negative" : "text-positive"}>
                            {fmtInt(conf.mismatches)} {conf.mismatches === 1 ? "sequence" : "sequences"} disagreed.
                          </span>
                        </p>
                      </div>

                      <div>
                        <p className="mb-1.5 text-xs text-muted-foreground">Reasons for the verdict</p>
                        {x.reasons.length ? (
                          <ul className="space-y-3">
                            {x.reasons.map((r) => (
                              <li key={r.code} className="text-sm">
                                <code className="font-mono text-[13px] text-negative">{r.code}</code>
                                <span className="text-foreground/85"> · {REASONS[r.code] ?? ""}</span>
                                <pre className="mt-1.5 overflow-x-auto rounded-md border border-gold/10 bg-ocean-deep px-3 py-2 font-mono text-xs text-foreground/75">
                                  {show(r.detail)}
                                </pre>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-positive">None. Every check passed.</p>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Checked in {fmt1(x.check_seconds)} s. Claim record: <code className="font-mono">{c?.file}</code>
                      </p>
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        </Card>
      </ViewSection>

      {ce ? (
        <ViewSection
          id="counterexample"
          title="The counterexample, shrunk"
          intro={
            <p>
              The shortest sequence the shrinker found where {shortName(ce.id).toLowerCase()} and the spec disagree:{" "}
              {fmtInt(ce.ops.filter((o) => o.op === "bill").length)} bills, then one payment. The spec paid {fmtInt(ce.model.allocations.length)}{" "}
              bills; the capped store read only {fmtInt(ce.store.allocations.length)}, so it left{" "}
              {fmtInt(ce.missed.length)} {ce.missed.length === 1 ? "bill" : "bills"} open while {fmtInt(ce.store.advance)}{" "}
              of the payment sat unapplied.
            </p>
          }
        >
          <div className="grid gap-4 lg:grid-cols-[2fr_3fr]">
            <Card title="The operations" bodyClassName="px-0 sm:px-0 pb-0" source={<Source from="verdicts" field="…shrunk_counterexample.ops" />}>
              <DataTable caption="The shrunk operation sequence" maxHeight="26rem" className="rounded-none border-x-0 border-b-0">
                <thead>
                  <tr>
                    <Th numeric>#</Th>
                    <Th>Operation</Th>
                    <Th numeric>Party</Th>
                    <Th numeric>Date</Th>
                    <Th numeric>Amount</Th>
                  </tr>
                </thead>
                <tbody>
                  {ce.ops.map((op, i) => (
                    <tr key={i} className={i === ce.ops.length - 1 ? "bg-gold/[0.07]" : undefined}>
                      <Td numeric>{i + 1}</Td>
                      <Td mono className={i === ce.ops.length - 1 ? "text-gold" : undefined}>{String(op.op)}</Td>
                      <Td numeric>{String(op.party ?? "")}</Td>
                      <Td numeric>{op.date === undefined ? "" : String(op.date)}</Td>
                      <Td numeric>{String(op.amount ?? "")}</Td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            </Card>
            <Card title="What each returned for the payment" source={<Source from="verdicts" field="…shrunk_counterexample.model, .store" calc="counterexampleComparison" />}>
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-gold/15 bg-gold/15 text-sm">
                {[
                  { who: "The spec", a: ce.model, total: ce.modelAllocated, tone: "text-positive" },
                  { who: "The capped store", a: ce.store, total: ce.storeAllocated, tone: "text-negative" },
                ].map((s) => (
                  <div key={s.who} className="bg-ocean-deep p-4">
                    <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">{s.who}</p>
                    <dl className="mt-3 space-y-2">
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">Bills paid</dt>
                        <dd className={`tabular-nums ${s.tone}`}>{fmtInt(s.a.allocations.length)}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">Allocated</dt>
                        <dd className="tabular-nums text-foreground">{fmtInt(s.total)}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">Left as advance</dt>
                        <dd className={`tabular-nums ${s.tone}`}>{fmtInt(s.a.advance)}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-foreground/85">
                Paid by the spec, not by the store:{" "}
                {ce.missed.map((m) => (
                  <span key={m.bill} className="mr-2 inline-block rounded border border-negative/30 px-1.5 py-0.5 font-mono text-xs text-negative">
                    bill {m.bill}: {m.amount}
                  </span>
                ))}
              </p>
              <p className="mt-3 text-sm text-pretty text-muted-foreground">
                Money stays unapplied while a bill is still owed, which breaks the rule that advances are always
                applied. Separately, Lean proves that the capped matching and the full one are not the same
                function.
              </p>
            </Card>
          </div>
        </ViewSection>
      ) : null}

      <ViewSection id="terminal" title="The same checks, in the terminal">
        <div className="grid gap-6 lg:grid-cols-2">
          <Screenshot src="/blog/gods-hand/check.png" alt="Terminal output of the check phase: each optimisation claim with its verdict and reasons" command="python3 bench/docker_run.py check" />
          <Screenshot src="/blog/gods-hand/counterexample.png" alt="Lean evaluating the capped matching on its counterexample" command="docker run --rm -t godshand/checker:dev python -m godshand counterexample">
            Lean evaluating both matchings on a counterexample.
          </Screenshot>
          <Screenshot src="/blog/gods-hand/model.png" alt="Operations sent to the compiled spec and its answers, then the test suite passing" command="… | docker run --rm -i godshand/checker:dev .lake/build/bin/ledgermodel">
            The compiled spec answering operations directly, then the test suite.
          </Screenshot>
        </div>
      </ViewSection>
    </div>
  );
}
