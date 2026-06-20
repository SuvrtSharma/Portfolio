import type { NodeMarkerProps } from "@/types";
import { Icon } from "@/lib/icons";
import { cn } from "@/lib/utils";

/**
 * The neutral island marker: an icon medallion above a parchment name label.
 * Purely presentational — interaction (focus, click) is owned by the renderer's
 * wrapping button. A theme can replace this via its `NodeMarker` slot.
 */
export function DefaultNodeMarker({ node, active, hovered }: NodeMarkerProps) {
  const raised = active || hovered;

  return (
    <span className="flex flex-col items-center gap-2">
      <span className="relative flex items-center justify-center">
        {/* Soft pulsing halo at rest; the raised state has its own ring/shadow. */}
        {!raised ? (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 animate-marker-glow rounded-full bg-gold blur-md motion-reduce:animate-none"
          />
        ) : null}
        <span
          className={cn(
            "flex size-12 items-center justify-center rounded-full border bg-ocean-deep/85 text-gold shadow-lg transition-all duration-300 sm:size-14",
            raised ? "scale-110 border-gold shadow-gold/20" : "border-gold/40",
            active &&
              "ring-2 ring-gold/60 ring-offset-2 ring-offset-ocean-deep",
          )}
        >
          <Icon name={node.iconKey} className="size-5 sm:size-6" />
        </span>
      </span>
      <span
        className={cn(
          "max-w-[9rem] rounded-md border px-2.5 py-1 text-center font-display text-xs leading-tight transition-colors sm:block",
          raised
            ? "block border-parchment-dark bg-parchment text-ink"
            : "hidden border-gold/20 bg-ocean-deep/80 text-foreground/90",
        )}
      >
        {node.title}
      </span>
    </span>
  );
}
