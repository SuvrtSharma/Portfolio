import type { ComponentType } from "react";

/**
 * Long-form story registry. Each entry is an explicit, statically-analysable
 * dynamic import of an `.mdx` file (Turbopack-friendly — no computed paths).
 * Add a story by dropping an `.mdx` file in this folder and registering it
 * under its project slug.
 */
export const storyLoaders: Record<
  string,
  () => Promise<{ default: ComponentType }>
> = {
  "caresmartz-evv": () => import("./caresmartz-evv.mdx"),
  "clock-in-out": () => import("./clock-in-out.mdx"),
  crophawk: () => import("./crophawk.mdx"),
  "blockchain-file-storage": () => import("./blockchain-file-storage.mdx"),
  "pathfinding-visualizer": () => import("./pathfinding-visualizer.mdx"),
};

export function hasStory(slug: string): boolean {
  return slug in storyLoaders;
}
