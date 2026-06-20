import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface SectionProps extends ComponentProps<"section"> {
  /** Width/padding overrides for the inner container. */
  containerClassName?: string;
}

/** Page section with a centred, max-width container and consistent vertical
 *  rhythm. `scroll-mt` offsets in-page anchors below the sticky header. */
export function Section({
  className,
  containerClassName,
  children,
  ...props
}: SectionProps) {
  return (
    <section className={cn("scroll-mt-20 py-16 sm:py-20", className)} {...props}>
      <div
        className={cn(
          "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8",
          containerClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}
