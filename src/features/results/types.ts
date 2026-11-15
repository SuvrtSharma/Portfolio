import type { ReactNode } from "react";

/** One tab of a dashboard. The first view of a dashboard is its overview,
 *  served at `/results/<slug>`; the others at `/results/<slug>/<id>`. */
export interface DashboardView {
  id: string;
  label: string;
  /** One sentence for the page's meta description. */
  description: string;
}

/** A headline figure for the results index and the overview. */
export interface HeadlineFigure {
  label: string;
  value: string;
  detail: string;
  tone: "positive" | "negative" | "gold" | "neutral";
}

/** The facts about a run that every view's header shows. */
export interface RunFacts {
  run: string;
  measuredAt: string;
  expires?: string;
  commit: string;
  /** Uncommitted paths at the time of the run, as git reported them. */
  uncommitted: string[];
}

/**
 * A dashboard implementation, registered by result-set slug. Rendering happens
 * on the server at build time, so implementations may read files.
 */
export interface Dashboard {
  views: DashboardView[];
  run(): RunFacts;
  headline(): HeadlineFigure[];
  renderView(viewId: string): ReactNode;
}
