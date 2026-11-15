import type { ResultSet } from "@/types";

/**
 * Result sets, one dashboard each. The dashboard itself is registered in
 * `features/results/registry.ts` under the same slug; this file holds only what
 * a card or a page header needs. Figures never go here: they are read from the
 * evidence files, so they can't drift from them.
 */
export const resultSets: ResultSet[] = [
  {
    slug: "gods-hand",
    title: "God's Hand: AI agents' claims, checked",
    shortTitle: "God's Hand",
    question:
      "When an AI agent claims an optimisation is safe and faster, can a tool decide what it means before anyone times it?",
    summary:
      "Six optimisation claims about a ledger API, judged for meaning by Lean 4 proofs, a live guarantee check and conformance to an executable spec, then timed in interleaved rounds. Every figure is read from the run's raw evidence files.",
    date: "2026-11-14",
    tags: ["Lean 4", "Formal methods", "SQLite", "Benchmarking", "AI agents"],
    posts: [
      "making-ai-agents-prove-their-claims",
      "how-the-claim-checker-is-built",
    ],
    source: { name: "God's Hand", visibility: "private" },
    draft: true,
  },
];
