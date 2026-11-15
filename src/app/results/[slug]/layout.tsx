import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { DashboardNav } from "@/features/results/dashboard-nav";
import { DashboardSwitcher } from "@/features/results/dashboard-switcher";
import { fmtDate } from "@/features/results/format";
import { getDashboard } from "@/features/results/registry";
import { getActiveVocabulary } from "@/lib/active-theme";
import { getDataProvider } from "@/lib/data";

export function generateStaticParams() {
  return getDataProvider()
    .getResultSets()
    .filter((set) => getDashboard(set.slug))
    .map((set) => ({ slug: set.slug }));
}

export const dynamicParams = false;

/** Shared frame of every dashboard view: what the results are, which run they
 *  come from, a switcher between dashboards, and the view tabs. */
export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = getDataProvider();
  const set = data.getResultSetBySlug(slug);
  const dashboard = getDashboard(slug);
  if (!set || !dashboard) notFound();

  const vocab = getActiveVocabulary();
  const run = dashboard.run();
  const posts = set.posts.map((s) => data.getPostBySlug(s)).filter((p) => p !== undefined);
  const options = data
    .getResultSets()
    .filter((s) => getDashboard(s.slug))
    .map((s) => ({ slug: s.slug, name: s.shortTitle, date: fmtDate(s.date) }));

  return (
    <>
      <SiteHeader brandName={data.getProfile().name} ctaLabel={vocab.exploreCta} ctaHref="/archipelago" />

      <main id="main" className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 pt-10 pb-16 sm:px-6 sm:pt-14 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/results"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-gold"
            >
              <ArrowLeft className="size-4" />
              All results
            </Link>
            <DashboardSwitcher current={slug} options={options} />
          </div>

          <header className="mt-6">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <p className="text-xs font-semibold tracking-[0.18em] text-gold uppercase">{vocab.resultsTitle}</p>
              {set.draft ? (
                <span className="rounded-full border border-gold/40 px-2 py-0.5 text-xs text-gold">Draft (hidden in production)</span>
              ) : null}
            </div>
            <h1 className="mt-3 max-w-4xl font-display text-3xl text-balance text-foreground sm:text-4xl">{set.title}</h1>
            <p className="mt-3 max-w-3xl text-lg text-pretty text-foreground/85">{set.question}</p>

            <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Run</dt>
                <dd className="font-mono text-[13px] text-foreground">{run.run}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Measured</dt>
                <dd className="text-foreground">{fmtDate(run.measuredAt)}</dd>
              </div>
              {run.expires ? (
                <div>
                  <dt className="text-xs text-muted-foreground">Measurements expire</dt>
                  <dd className="text-foreground">{fmtDate(run.expires)}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-xs text-muted-foreground">Code at commit</dt>
                <dd className="font-mono text-[13px] text-foreground">{run.commit.slice(0, 12)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Source</dt>
                <dd className="inline-flex items-center gap-1 text-foreground">
                  {set.source.visibility === "private" ? <Lock className="size-3 text-muted-foreground" aria-hidden /> : null}
                  {set.source.url ? (
                    <a href={set.source.url} className="text-gold hover:underline">
                      {set.source.name}
                    </a>
                  ) : (
                    `${set.source.name}, ${set.source.visibility} repository`
                  )}
                </dd>
              </div>
              {posts.length ? (
                <div>
                  <dt className="text-xs text-muted-foreground">Written up in</dt>
                  <dd className="flex flex-wrap gap-x-3">
                    {posts.map((p, i) => (
                      <Link key={p.slug} href={`/blog/${p.slug}`} className="text-gold hover:underline">
                        Part {i + 1}
                      </Link>
                    ))}
                  </dd>
                </div>
              ) : null}
            </dl>
          </header>

          <div className="mt-8">
            <DashboardNav slug={slug} views={dashboard.views.map(({ id, label }) => ({ id, label }))} />
          </div>

          <div className="pt-10">{children}</div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
