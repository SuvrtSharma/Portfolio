"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Ticked } from "../ui";
import type { Finding } from "./evidence";

const KIND: Record<Finding["kind"], { label: string; className: string; blurb: string }> = {
  finding: { label: "Finding", className: "border-positive/40 text-positive", blurb: "something true we learned" },
  caught: { label: "Caught", className: "border-gold/45 text-gold", blurb: "a wrong claim the tooling rejected" },
  failure: { label: "Failure", className: "border-foreground/30 text-foreground/80", blurb: "something that didn't work" },
  mistake: { label: "Mistake", className: "border-negative/45 text-negative", blurb: "an error by the agent" },
};

/** The findings log with a filter by kind. Filtering is the only thing that
 *  needs the browser; the entries are rendered from findings.json as they are. */
export function FindingsExplorer({ findings }: { findings: Finding[] }) {
  const [kind, setKind] = useState<Finding["kind"] | "all">("all");
  const kinds = (Object.keys(KIND) as Finding["kind"][]).map((k) => ({ k, n: findings.filter((f) => f.kind === k).length }));
  const shown = kind === "all" ? findings : findings.filter((f) => f.kind === kind);

  const chip = (value: Finding["kind"] | "all", label: string, n: number) => (
    <button
      key={value}
      type="button"
      onClick={() => setKind(value)}
      aria-pressed={kind === value}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
        kind === value ? "border-gold bg-gold/10 text-foreground" : "border-gold/20 text-muted-foreground hover:border-gold/50 hover:text-foreground",
      )}
    >
      {label}
      <span className="text-xs text-muted-foreground tabular-nums">{n}</span>
    </button>
  );

  return (
    <div>
      <div role="group" aria-label="Filter by kind" className="flex flex-wrap gap-2">
        {chip("all", "All", findings.length)}
        {kinds.map(({ k, n }) => chip(k, KIND[k].label, n))}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        {kind === "all"
          ? "Kinds: " + kinds.map(({ k }) => `${KIND[k].label.toLowerCase()} (${KIND[k].blurb})`).join(", ") + "."
          : `${KIND[kind].label}: ${KIND[kind].blurb}.`}
      </p>

      <ol className="mt-6 space-y-4">
        {shown.map((f) => (
          <li key={f.id} id={f.id} className="scroll-mt-24 rounded-lg border border-gold/15 bg-ocean-panel/50 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
              <span className="font-mono text-gold">{f.id}</span>
              <span className={cn("rounded-full border px-2 py-0.5 text-xs leading-none font-medium", KIND[f.kind].className)}>{KIND[f.kind].label}</span>
              <time dateTime={f.date} className="text-muted-foreground tabular-nums">
                {f.date}
              </time>
            </div>
            <h3 className="mt-2 font-sans text-base font-semibold tracking-normal text-pretty text-foreground">
              <Ticked text={f.title} />
            </h3>
            <dl className="mt-3 grid gap-x-6 gap-y-3 text-sm md:grid-cols-3">
              {(
                [
                  ["Expected", f.expected],
                  ["Observed", f.observed],
                  ["What changed", f.impact],
                ] as const
              ).map(([term, text]) => (
                <div key={term}>
                  <dt className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">{term}</dt>
                  <dd className="mt-1 text-pretty text-foreground/85">
                    <Ticked text={text} />
                  </dd>
                </div>
              ))}
            </dl>
            {f.evidence.length ? (
              <div className="mt-4 border-t border-gold/10 pt-3">
                <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">Evidence, in the repository</p>
                <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                  {f.evidence.map((e) => (
                    <li key={e} className="font-mono text-xs break-all text-foreground/75">
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
