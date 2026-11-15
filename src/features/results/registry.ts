import { godsHandDashboard } from "./gods-hand";
import type { Dashboard } from "./types";

/**
 * Dashboard implementations, keyed by the slug of their result set in
 * `content/results.ts`. Adding a dashboard is one entry here plus one there;
 * the routes, index, switcher and tabs pick it up without changes.
 */
const dashboards: Record<string, Dashboard> = {
  "gods-hand": godsHandDashboard,
};

export function getDashboard(slug: string): Dashboard | undefined {
  return dashboards[slug];
}
