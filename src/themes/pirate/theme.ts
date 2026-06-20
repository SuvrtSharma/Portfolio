import type { ThemeDefinition } from "@/types";
import { pirateVocabulary } from "./vocabulary";

/**
 * The Pirate theme.
 *
 * Tokens live in `globals.css` under `.theme-pirate`; this object supplies the
 * vocabulary and (later) decorative slot components. Slots start empty — the
 * engine renders neutral fallbacks — and are filled in as the map/panel
 * features are built, so the theme can grow without the engine knowing.
 */
export const pirateTheme: ThemeDefinition = {
  id: "pirate",
  meta: {
    name: "Pirate",
    description:
      "A weathered nautical treasure-map aesthetic — parchment, gold leaf, and deep ocean.",
  },
  tokenClass: "theme-pirate",
  vocabulary: pirateVocabulary,
  slots: {},
};
