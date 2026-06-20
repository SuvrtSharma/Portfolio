import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getDataProvider } from "@/lib/data";

/** Generated sitemap covering the static routes and every project story. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url.replace(/\/$/, "");
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, priority: 1 },
    { url: `${base}/archipelago`, lastModified: now, priority: 0.8 },
  ];

  const projectRoutes: MetadataRoute.Sitemap = getDataProvider()
    .getProjects()
    .map((project) => ({
      url: `${base}/projects/${project.slug}`,
      lastModified: now,
      priority: 0.6,
    }));

  return [...staticRoutes, ...projectRoutes];
}
