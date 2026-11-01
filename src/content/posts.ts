import type { Post, PostOrigin } from "@/types";

const CS360_BLOG = "CS360 Engineering Blog";
const CS360_BASE =
  "https://caresmartz-360.github.io/engineeringblog/engineering";

function cs360(
  path: string,
  relation: PostOrigin["relation"] = "republished",
): PostOrigin {
  return { site: CS360_BLOG, url: `${CS360_BASE}/${path}`, relation };
}

/**
 * Blog post metadata. The prose for each post lives in
 * `content/posts/<slug>.mdx` and is registered in `content/posts/index.ts`.
 * Order here doesn't matter; the data provider sorts by date.
 */
export const posts: Post[] = [
  {
    slug: "the-llm-is-not-allowed-to-state-facts",
    project: "arqon",
    title: "The LLM in my SQL analyzer isn't allowed to state facts",
    summary:
      "How Arqon draws a hard line between deterministic analysis and AI explanation, and how the engine ends up verifying the AI's own suggested fixes.",
    date: "2026-11-01",
    tags: ["Architecture", "AI", "SQL Server", "Arqon"],
    readingMinutes: 3,
  },
  {
    slug: "enforcing-architecture-with-a-failing-test",
    project: "arqon",
    title: "I wrote about layered architecture. Then I made the build enforce it.",
    summary:
      "Deciding Platform, Domain, and Innovation boundaries is easy. Keeping them is not, so in Arqon the dependency rule is a test that fails CI.",
    date: "2026-11-01",
    tags: ["Architecture", ".NET", "Testing", "Arqon"],
    readingMinutes: 4,
  },
  {
    slug: "when-a-good-procedure-scored-zero",
    project: "arqon",
    title: "When a well-written stored procedure scored zero",
    summary:
      "A user's report exposed two flaws in Arqon's scoring formula. The fix: confidence per rule, diminishing penalties, and a breakdown that shows its work.",
    date: "2026-11-01",
    tags: ["SQL Server", "Metrics", "Design", "Arqon"],
    readingMinutes: 4,
  },
  {
    slug: "sql-server-tooling-field-notes",
    project: "arqon",
    title: "Field notes from building SQL Server tooling",
    summary:
      "GO isn't T-SQL, .sqlplan files are UTF-16, and Windows can block your own fresh DLLs. Nine boundary bugs worth knowing before you hit them.",
    date: "2026-11-01",
    tags: ["SQL Server", ".NET", "VS Code", "Debugging"],
    readingMinutes: 4,
  },
  {
    slug: "llm-reality-check",
    title: "The tool is only as good as the hands on the keyboard: an LLM reality check",
    summary:
      "An AI assistant celebrated a deployment that never happened and anchored on one architecture until pushed. What that says about working with LLMs in general.",
    date: "2026-11-01",
    tags: ["AI", "LLMs", "Productivity"],
    readingMinutes: 4,
    origin: cs360(
      "ai/productivity/2025/12/12/the-tool-is-only-as-good-as-the-hands-on-the-keyboard-a-copilot-reality-check.html",
      "adapted",
    ),
  },
  {
    slug: "clean-code-vs-pragmatic-code",
    project: "caresmartz-evv",
    title: "Clean Code vs Pragmatic Code: preparing for a Platform, Domain, and Innovation architecture",
    summary:
      "Different layers deserve different engineering mindsets. What I learned watching senior engineers decide, and from building a small three-layer POC.",
    date: "2026-01-17",
    tags: ["Architecture", "Clean Code", "C#"],
    readingMinutes: 7,
    origin: cs360(
      "architecture/clean-code/2026/01/17/clean-code-vs-pragmatic-code-preparing-for-our-platform-domain-and-innovation-architecture.html",
    ),
  },
  {
    slug: "legacy-code-meets-tsqlt",
    project: "caresmartz-evv",
    title: "When legacy code meets modern testing: a junior developer's tSQLt journey",
    summary:
      "Unit-testing a legacy stored procedure with tSQLt surfaced a runtime conversion failure, URL parsing that broke on real data, and a missing index filter.",
    date: "2025-12-26",
    tags: ["SQL Server", "Testing", "tSQLt", "Legacy Code"],
    readingMinutes: 6,
    origin: cs360(
      "2025/12/26/when-legacy-code-meets-modern-testing-a-junior-developers-tsqlt-journey.html",
    ),
  },
  {
    slug: "how-dapr-handles-event-driven-architecture",
    project: "caresmartz-evv",
    title: "How Dapr handles event-driven architecture (and why it matters more than you think)",
    summary:
      "Sidecars, broker-agnostic pub/sub, declarative subscriptions, and reliability by default: why Dapr's constraints are a feature for event-driven systems.",
    date: "2025-12-15",
    tags: ["Architecture", "Distributed Systems", "Dapr"],
    readingMinutes: 6,
    origin: cs360(
      "architecture/2025/12/15/how-dapr-handles-event-driven-architecture-and-why-it-matters-more-than-you-think.markdown.html",
    ),
  },
];
