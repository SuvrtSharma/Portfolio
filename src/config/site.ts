import type { ThemeId } from "@/types";

/**
 * Global, deploy-time configuration. The one place a buyer of this template
 * edits to rebrand. Content (projects, skills, log…) lives in `src/content`.
 */
export const siteConfig = {
  /** Used for <title> templates, OpenGraph, and structured data. */
  name: "Suvrt Sharma",
  shortName: "Suvrt",
  title: "Suvrt Sharma — Software Engineer",
  description:
    "Software engineer building event-driven, distributed healthcare systems — and once autonomous agri-drones. Explore my work as an interactive archipelago, or skip straight to the résumé.",
  /** Canonical site URL (no trailing slash). Override per deployment. */
  url: "https://example.com",
  locale: "en",
  /** Active theme. Swap to any registered theme id to re-skin the whole site. */
  themeId: "pirate" satisfies ThemeId as ThemeId,
} as const;

export type SiteConfig = typeof siteConfig;
