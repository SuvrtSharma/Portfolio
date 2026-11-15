import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDashboard } from "@/features/results/registry";
import { getDataProvider } from "@/lib/data";

type Params = { params: Promise<{ slug: string; view: string }> };

/** Every view after the first, of every published dashboard. */
export function generateStaticParams() {
  return getDataProvider()
    .getResultSets()
    .flatMap((set) => (getDashboard(set.slug)?.views.slice(1) ?? []).map((view) => ({ slug: set.slug, view: view.id })));
}

export const dynamicParams = false;

function find(slug: string, viewId: string) {
  const dashboard = getDashboard(slug);
  const view = dashboard?.views.slice(1).find((v) => v.id === viewId);
  return dashboard && view ? { dashboard, view } : undefined;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, view } = await params;
  const set = getDataProvider().getResultSetBySlug(slug);
  const found = find(slug, view);
  if (!set || !found) return {};
  return { title: `${found.view.label} · ${set.shortTitle} results`, description: found.view.description };
}

export default async function DashboardViewPage({ params }: Params) {
  const { slug, view } = await params;
  const found = find(slug, view);
  if (!found) notFound();
  return found.dashboard.renderView(found.view.id);
}
