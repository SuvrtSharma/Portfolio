import type { ThemeDefinition, ThemeId } from "@/types";
import { pirateTheme } from "./pirate/theme";

/** Theme used when a requested id is unknown. */
export const DEFAULT_THEME_ID: ThemeId = pirateTheme.id;

/** All registered themes, keyed by id. Add a theme here and nowhere else. */
const registry: Record<ThemeId, ThemeDefinition> = {
  [pirateTheme.id]: pirateTheme,
};

export function getTheme(id: ThemeId): ThemeDefinition {
  return registry[id] ?? registry[DEFAULT_THEME_ID];
}

export function listThemes(): ThemeDefinition[] {
  return Object.values(registry);
}
