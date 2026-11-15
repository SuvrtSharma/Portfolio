import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { formatPostDate } from "@/features/blog/format-date";
import { getDashboard } from "@/features/results/registry";
import { getActiveVocabulary } from "@/lib/active-theme";
import { getDataProvider } from "@/lib/data";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Results",
  description:
    "Dashboards of measured results from my experiments, each read straight from the run's raw evidence files.",
};

const tone = {
  positive: "text-positive",
  negative: "text-negative",
  gold: "text-gold",
  neutral: "text-foreground",
} as const;

export default function ResultsIndexPage() {
  const data = getDataProvider();
  const vocab = getActiveVocabulary();
  const sets = data.getResultSets();

  return (
    <>
      <SiteHeader brandName={data.getProfile().name} ctaLabel={vocab.exploreCta} ctaHref="/archipelago" />

      <main id="main" className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <header className="max-w-3xl">
            <p className="text-xs font-semibold tracking-[0.18em] text-gold uppercase">{vocab.resultsTitle}</p>
            <h1 className="mt-3 font-display text-3xl text-balance text-foreground sm:text-4xl">Results</h1>
            <p className="mt-3 text-lg text-pretty text-foreground/85">
              Measured results from my experiments, one dashboard each. Every number is read from the run&apos;s raw
              evidence files, which you can download from the dashboard and check yourself.
            </p>
          </header>

          {sets.length === 0 ? (
            <p className="mt-12 rounded-lg border border-gold/15 bg-ocean-panel/50 p-5 text-muted-foreground">
              The first results are still being written up. Check back soon.
            </p>
          ) : (
            <ul className="mt-12 space-y-6">
              {sets.map((set) => {
                const dashboard = getDashboard(set.slug);
                const run = dashboard?.run();
                const figures = dashboard?.headline() ?? [];
                return (
                  <li key={set.slug}>
                    <Link
                      href={`/results/${set.slug}`}
                      className="group block rounded-lg border border-gold/15 bg-ocean-panel/50 transition-colors hover:border-gold/45 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
                    >
                      <div className="p-5 sm:p-6">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
                          <time dateTime={set.date}>Run of {formatPostDate(set.date)}</time>
                          {run ? <span className="font-mono text-xs">{run.run}</span> : null}
                          {set.source.visibility === "private" ? (
                            <span className="inline-flex items-center gap-1 text-xs">
                              <Lock className="size-3" aria-hidden />
                              Private code, public evidence
                            </span>
                          ) : null}
                          {set.draft ? (
                            <span className="rounded-full border border-gold/40 px-2 py-0.5 text-xs text-gold">Draft</span>
                          ) : null}
                        </div>
                        <h2 className="mt-3 font-display text-2xl text-balance text-foreground group-hover:text-gold">
                          {set.title}
                        </h2>
                        <p className="mt-2 max-w-3xl text-pretty text-foreground/85">{set.question}</p>
                        <p className="mt-2 max-w-3xl text-sm text-pretty text-muted-foreground">{set.summary}</p>
                      </div>

                      {figures.length ? (
                        <dl className="grid grid-cols-2 gap-px border-t border-gold/15 bg-gold/15 sm:grid-cols-5">
                          {figures.map((f) => (
                            <div key={f.label} className="bg-ocean-panel px-5 py-4 last:odd:col-span-2 sm:last:odd:col-span-1">
                              <dt className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">{f.label}</dt>
                              <dd className={cn("mt-1.5 font-display text-2xl tabular-nums", tone[f.tone])}>{f.value}</dd>
                            </div>
                          ))}
                        </dl>
                      ) : null}

                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gold/15 px-5 py-3 sm:px-6">
                        <ul className="flex flex-wrap gap-1.5">
                          {set.tags.map((tag) => (
                            <li key={tag} className="rounded-md border border-gold/15 bg-ocean-panel/60 px-2 py-0.5 text-[11px] tracking-wide text-foreground/80">
                              {tag}
                            </li>
                          ))}
                        </ul>
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-gold">
                          Open the dashboard
                          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
