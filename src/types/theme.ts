import type { ComponentType, ReactNode } from "react";
import type { WorldNode } from "./world";

/**
 * The theme contract.
 *
 * A theme is intentionally thin: it supplies (1) a set of design tokens via a
 * CSS class, (2) the vocabulary used for themed labels, and (3) a small number
 * of decorative "slot" components that genuinely differ between themes. It must
 * never contain business logic or data access — that lives behind
 * {@link IWorldDataProvider}. This keeps themes open for extension (add a new
 * one) without modifying the engine (Open/Closed).
 */
export type ThemeId = string;

/**
 * Human-facing labels. The engine renders `vocabulary.nodePlural` instead of
 * the hardcoded word "Islands", so a sci-fi theme can say "Planets" without
 * any engine change.
 */
export interface ThemeVocabulary {
  worldName: string;
  worldNameShort: string;
  nodeSingular: string;
  nodePlural: string;
  exploreCta: string;
  skimCta: string;
  logTitle: string;
  graveyardTitle: string;
  harborTitle: string;
  journalTitle: string;
  mapPrompt: string;
}

export interface NodeMarkerProps {
  node: WorldNode;
  active?: boolean;
  hovered?: boolean;
}

export interface PanelFrameProps {
  title?: ReactNode;
  children: ReactNode;
}

/**
 * Decorative components a theme MAY override. Each is optional; the engine
 * provides neutral fallbacks so a theme can be created with tokens + vocabulary
 * alone and progressively add flavour.
 */
export interface ThemeSlots {
  NodeMarker?: ComponentType<NodeMarkerProps>;
  PanelFrame?: ComponentType<PanelFrameProps>;
  MapDecor?: ComponentType;
}

export interface ThemeDefinition {
  id: ThemeId;
  meta: {
    name: string;
    description: string;
  };
  /** CSS class that defines this theme's design tokens (applied to the root). */
  tokenClass: string;
  vocabulary: ThemeVocabulary;
  slots: ThemeSlots;
}
