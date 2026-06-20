import { CanvasMapRenderer } from "./canvas-map-renderer";
import { DomMapRenderer } from "./dom-map-renderer";
import type { MapRendererId, RegisteredRenderer } from "./types";

/**
 * The renderer registry. The engine is designed for three tiers; only `dom`
 * ships today. To add Canvas or Three.js later: implement the component, set
 * its `status` to `"ready"`, and attach it here. Nothing else changes.
 */
export const mapRenderers: Record<MapRendererId, RegisteredRenderer> = {
  dom: {
    id: "dom",
    label: "DOM / SVG",
    shortLabel: "DOM",
    description: "Accessible, SEO-friendly, featherweight. The default.",
    status: "ready",
    Component: DomMapRenderer,
  },
  canvas: {
    id: "canvas",
    label: "Canvas 2D",
    shortLabel: "Canvas",
    description:
      "One paint surface for hundreds of nodes — cheap effects, tiny bundle, no 3D complexity.",
    status: "ready",
    Component: CanvasMapRenderer,
  },
  three: {
    id: "three",
    label: "Three.js (WebGL)",
    shortLabel: "WebGL",
    description:
      "True 3D depth and camera fly-throughs. Lazy-loaded, opt-in spectacle.",
    status: "planned",
  },
};

export const DEFAULT_MAP_RENDERER: MapRendererId = "dom";

/** Returns the renderer for `id`, falling back to the default if it isn't ready. */
export function getMapRenderer(id: MapRendererId): RegisteredRenderer {
  const renderer = mapRenderers[id];
  if (renderer?.status === "ready" && renderer.Component) return renderer;
  return mapRenderers[DEFAULT_MAP_RENDERER];
}

export function listMapRenderers(): RegisteredRenderer[] {
  return Object.values(mapRenderers);
}
