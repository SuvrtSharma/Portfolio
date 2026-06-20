import { Icon } from "@/lib/icons";
import { cn } from "@/lib/utils";

/** A decorative dashed rule with a centred glyph — used between sections. */
export function Ornament({
  icon = "compass",
  className,
}: {
  icon?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("flex items-center gap-3 text-gold/60", className)}
      aria-hidden
    >
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/40" />
      <Icon name={icon} className="size-4" />
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/40" />
    </div>
  );
}
