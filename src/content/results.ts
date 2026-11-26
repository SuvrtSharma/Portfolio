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
      "When an AI agent says a change is safe and faster, can a tool check that before anyone believes it?",
    summary:
      "An AI agent built a small billing system and proposed speed-ups for it. Each was checked for correctness first, against rules a person reviewed, and only then timed. The safe ones made it several times faster; the rejected ones would have looked fine in everyday use. Every figure is read from the raw evidence files.",
    date: "2026-11-14",
    tags: ["Lean 4", "Formal methods", "SQLite", "Benchmarking", "AI agents"],
    posts: [
      "ai-agents-prove-it-plain-english",
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
      "A research paper describes a shortcut for fixing a loan ledger when transactions arrive late. Does it always give the right answer, and is there a shortcut that does?",
    summary:
      "The paper's shortcut was modelled and compared with recalculating everything. It usually agrees, but not always, and in some cases it doesn't finish. A different shortcut was proved to give exactly the right answer, and measured much faster in the project's own code. Every figure is read from the evidence files.",
    date: "2026-11-24",
    tags: ["Lean 4", "Formal methods", "Ledgers", "Counterexamples", "AI agents"],
    posts: ["ai-agents-prove-it-plain-english", "a-ledger-i-didnt-write"],
    source: { name: "Burden of Proof", visibility: "private" },
  },
  {
    slug: "helios",
    title: "HELIOS: can a cheap Sun sensor keep a cheap gyro honest?",
    shortTitle: "HELIOS (in progress)",
    question:
      "Low-cost gyroscopes drift. How much of that drift can a low-cost Sun sensor remove, what can it never see, and does it all fit on a small microcontroller?",
    summary:
      "Work in progress. Five ways to estimate orientation from a simulated low-cost gyro, accelerometer and Sun sensor, compared over eight scenarios, then ported to C for an ESP32 and checked against Python. Simulation only so far; the hardware phases are next.",
    date: "2026-11-26",
    tags: ["Sensor fusion", "Kalman filter", "Embedded C", "ESP32", "Simulation"],
    posts: ["cheap-sun-sensor-cheap-gyro"],
    source: { name: "HELIOS", visibility: "private" },
  },
];
