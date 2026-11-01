import type { ComponentType } from "react";

/**
 * Blog post body registry. Each entry is an explicit, statically-analysable
 * dynamic import of an `.mdx` file (Turbopack-friendly — no computed paths).
 * Add a post by dropping an `.mdx` file in this folder, registering it here
 * under its slug, and adding its metadata to `content/posts.ts`.
 */
export const postLoaders: Record<
  string,
  () => Promise<{ default: ComponentType }>
> = {
  "the-llm-is-not-allowed-to-state-facts": () =>
    import("./the-llm-is-not-allowed-to-state-facts.mdx"),
  "enforcing-architecture-with-a-failing-test": () =>
    import("./enforcing-architecture-with-a-failing-test.mdx"),
  "when-a-good-procedure-scored-zero": () =>
    import("./when-a-good-procedure-scored-zero.mdx"),
  "sql-server-tooling-field-notes": () =>
    import("./sql-server-tooling-field-notes.mdx"),
  "llm-reality-check": () => import("./llm-reality-check.mdx"),
  "clean-code-vs-pragmatic-code": () =>
    import("./clean-code-vs-pragmatic-code.mdx"),
  "legacy-code-meets-tsqlt": () => import("./legacy-code-meets-tsqlt.mdx"),
  "how-dapr-handles-event-driven-architecture": () =>
    import("./how-dapr-handles-event-driven-architecture.mdx"),
};
