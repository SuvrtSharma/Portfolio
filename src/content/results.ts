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
    title: "Burden of Proof: AI agents' claims, checked",
    shortTitle: "Burden of Proof",
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
    source: { name: "Burden of Proof", visibility: "private" },
  },
  {
    slug: "retroactive-ledger",
    title: "Burden of Proof, part 2: a published ledger algorithm, checked",
    shortTitle: "Burden of Proof: part 2",
    question:
      "A draft paper's fork-and-sync claims to correct a loan ledger for late events without a full rebuild. Does it keep the rebuild's meaning, and is there an optimisation that does?",
    summary:
      "Precise Ledger Pro's fork-and-sync, modelled in Lean 4 and checked against a full rebuild. Three proved counterexamples, run back through the project's own Haskell and Java code; a cheaper rebuild proved exact and timed in that code; and a four-event case on which fork-and-sync doesn't finish. Every figure is read from the evidence files.",
    date: "2026-11-24",
    tags: ["Lean 4", "Formal methods", "Ledgers", "Counterexamples", "AI agents"],
    posts: ["a-ledger-i-didnt-write"],
    source: { name: "Burden of Proof", visibility: "private" },
  },
];
