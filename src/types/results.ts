/**
 * A published set of results: one experiment, shown as a dashboard at
 * `/results/<slug>`. This is metadata only. The figures come from the
 * experiment's raw evidence files, which the dashboard reads at build time.
 */
export interface ResultSet {
  slug: string;
  title: string;
  /** Compact name for the dashboard switcher and cards ("Burden of Proof"). */
  shortTitle: string;
  /** The question the results answer, in one sentence. */
  question: string;
  /** Two or three sentences for the index card and the meta description. */
  summary: string;
  /** Date the measured run finished, as ISO `YYYY-MM-DD`. */
  date: string;
  tags: string[];
  /** Slugs of the posts that write these results up. */
  posts: string[];
  /** Where the evidence comes from. */
  source: ResultSource;
  /** Drafts render under `npm run dev` and are excluded from production builds. */
  draft?: boolean;
}

export interface ResultSource {
  /** Human name of the repository or system the evidence came from. */
  name: string;
  visibility: "public" | "private";
  /** Link to the source, when it is public. */
  url?: string;
}
