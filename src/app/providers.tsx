"use client";

import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/themes";

/**
 * Client-side providers. Kept as a single boundary so the root layout stays a
 * Server Component and `children` continue to render on the server.
 */
export function Providers({
  themeId,
  children,
}: {
  themeId: string;
  children: ReactNode;
}) {
  return (
    <ThemeProvider themeId={themeId}>
      <TooltipProvider>{children}</TooltipProvider>
    </ThemeProvider>
  );
}
