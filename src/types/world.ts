import type { Vec2 } from "./geometry";
import type { MediaAsset } from "./content";

/**
 * Stable, theme-neutral categories. A theme uses these to choose an icon and
 * styling, but the engine only ever reasons about the category — never about
 * the pirate label ("Monolith Isle", "Microservice Reef", ...).
 */
export type NodeCategory =
  | "monolith"
  | "microservice"
  | "project"
  | "infrastructure"
  | "research"
  | "graveyard"
  | "harbor";

/**
 * A single point of interest on the world map. In the pirate theme this is an
 * island; in a minimal theme it might be a card; in a sci-fi theme a planet.
 */
export interface WorldNode {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: NodeCategory;
  /** Position in normalized map space (0–100 on each axis). */
  position: Vec2;
  iconKey: string;
  /** References into the content layer, resolved by the data provider. */
  projectSlugs?: string[];
  skillGroupIds?: string[];
  bugStoryIds?: string[];
  /** Optional slug for long-form (MDX) content shown in the detail panel. */
  storySlug?: string;
}

/** A travel route drawn between two nodes (the dashed routes on the map). */
export interface WorldEdge {
  from: string;
  to: string;
}

export interface World {
  /** Canvas aspect ratio (width / height) used to letterbox the map. */
  aspectRatio: number;
  /** Illustrated map background. */
  background?: MediaAsset;
  nodes: WorldNode[];
  edges: WorldEdge[];
}
