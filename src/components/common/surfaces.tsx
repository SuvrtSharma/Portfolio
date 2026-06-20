import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * A weathered parchment panel — the light "manuscript" surface used for hero
 * cards, island labels, and project write-ups. Colours come entirely from
 * theme tokens, so a non-pirate theme restyles it for free.
 */
export function Parchment({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "relative rounded-lg bg-parchment text-ink shadow-[0_8px_30px_rgba(0,0,0,0.45)] ring-1 ring-inset ring-parchment-dark/70",
        "before:pointer-events-none before:absolute before:inset-1 before:rounded-md before:border before:border-parchment-dark/40 before:content-['']",
        className,
      )}
      {...props}
    />
  );
}

/**
 * A dark "ocean" panel — the translucent surface used for the site chrome and
 * data-dense sections (tech stack, log).
 */
export function Panel({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-lg border border-gold/15 bg-ocean-panel/70 shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}
