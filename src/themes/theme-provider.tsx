"use client";

import { createContext, use, useMemo, type ReactNode } from "react";
import type { ThemeDefinition, ThemeVocabulary } from "@/types";
import { getTheme } from "./registry";

const ThemeContext = createContext<ThemeDefinition | null>(null);

/**
 * Resolves the active theme on the client from a serializable id. We pass the
 * id (not the definition) across the RSC boundary because a theme may carry
 * component slots, which are not serializable.
 */
export function ThemeProvider({
  themeId,
  children,
}: {
  themeId: string;
  children: ReactNode;
}) {
  const theme = useMemo(() => getTheme(themeId), [themeId]);
  return <ThemeContext value={theme}>{children}</ThemeContext>;
}

export function useTheme(): ThemeDefinition {
  const theme = use(ThemeContext);
  if (!theme) {
    throw new Error("useTheme must be used within a <ThemeProvider>.");
  }
  return theme;
}

export function useVocabulary(): ThemeVocabulary {
  return useTheme().vocabulary;
}
