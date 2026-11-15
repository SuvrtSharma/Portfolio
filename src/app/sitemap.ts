import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getDashboard } from "@/features/results/registry";
import { getDataProvider } from "@/lib/data";

/** Generated sitemap covering the static routes, every project story, every
 *  post, and every view of every published results dashboard. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url.replace(/\/$/, "");
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, priority: 1 },
    { url: `${base}/archipelago`, lastModified: now, priority: 0.8 },
    { url: `${base}/blog`, lastModified: now, priority: 0.7 },
  ];

  const projectRoutes: MetadataRoute.Sitemap = getDataProvider()
    .getProjects()
    .map((project) => ({
      url: `${base}/projects/${project.slug}`,
      lastModified: now,
      priority: 0.6,
    }));

  const postRoutes: MetadataRoute.Sitemap = getDataProvider()
    .getPosts()
    .map((post) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      priority: 0.6,
    }));

  const sets = getDataProvider().getResultSets();
  const resultRoutes: MetadataRoute.Sitemap = sets.length
    ? [
        { url: `${base}/results`, lastModified: now, priority: 0.7 },
        ...sets.flatMap((set) =>
          (getDashboard(set.slug)?.views ?? []).map((view, i) => ({
            url: i === 0 ? `${base}/results/${set.slug}` : `${base}/results/${set.slug}/${view.id}`,
            lastModified: new Date(set.date),
            priority: i === 0 ? 0.6 : 0.4,
          })),
        ),
      ]
    : [];

  return [...staticRoutes, ...projectRoutes, ...postRoutes, ...resultRoutes];
}
