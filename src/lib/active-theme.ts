import { siteConfig } from "@/config/site";
import { getTheme } from "@/themes";
import type { ThemeDefinition, ThemeVocabulary } from "@/types";

/** Server-side accessor for the active theme (mirror of the client `useTheme`).
 *  Lets Server Components read vocabulary without a client boundary. */
export function getActiveTheme(): ThemeDefinition {
  return getTheme(siteConfig.themeId);
}

export function getActiveVocabulary(): ThemeVocabulary {
  return getActiveTheme().vocabulary;
}
