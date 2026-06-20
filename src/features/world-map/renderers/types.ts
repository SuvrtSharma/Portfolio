import type { ComponentType } from "react";
import type { NodeMarkerProps, World } from "@/types";

/**
 * The three renderer tiers the engine is designed to support. Only `dom` is
 * implemented today; `canvas` and `three` are registered as `planned` so the
 * architecture is visible and adding them later is a one-file change.
 *
 * - `dom`    — SVG/HTML elements. Accessible, SEO-friendly, featherweight.
 * - `canvas` — single 2D canvas. High performance + cheap effects at scale,
 *              tiny bundle, without full 3D complexity.
 * - `three`  — WebGL via React Three Fiber. True depth and camera fly-throughs;
 *              lazy-loaded, opt-in spectacle.
 */
export type MapRendererId = "dom" | "canvas" | "three";

/**
 * The renderer contract. The engine owns interaction state (selection, hover)
 * and the data; a renderer only knows how to *draw* the world and report
 * pointer intent back. Camera/viewport behaviour is intentionally left to each
 * renderer (a DOM transform vs. a real 3D camera are not the same thing).
 */
export interface MapRendererProps {
  world: World;
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  onHoverNode: (id: string | null) => void;
  /** Theme-supplied marker; renderers fall back to a neutral default. */
  NodeMarker?: ComponentType<NodeMarkerProps>;
}

export type MapRendererComponent = ComponentType<MapRendererProps>;

export type RendererStatus = "ready" | "planned";

export interface RegisteredRenderer {
  id: MapRendererId;
  label: string;
  /** Compact label for small screens. */
  shortLabel: string;
  description: string;
  status: RendererStatus;
  /** Present only when `status === "ready"`. */
  Component?: MapRendererComponent;
}
