import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDashboard } from "@/features/results/registry";
import { getDataProvider } from "@/lib/data";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const set = getDataProvider().getResultSetBySlug(slug);
  if (!set) return {};
  return { title: `${set.shortTitle} results`, description: set.summary };
}

/** A dashboard's first view, its overview. */
export default async function DashboardOverviewPage({ params }: Params) {
  const { slug } = await params;
  const dashboard = getDashboard(slug);
  const first = dashboard?.views[0];
  if (!dashboard || !first) notFound();
  return dashboard.renderView(first.id);
}
