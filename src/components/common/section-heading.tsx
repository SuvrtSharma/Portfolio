import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
  /** Heading id, useful for `aria-labelledby` on the parent <section>. */
  id?: string;
}

/** Consistent section header: a gold eyebrow, a display title, and an optional
 *  supporting line. Used by every landing section for visual rhythm. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  id,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {eyebrow ? (
        <span className="text-xs font-semibold tracking-[0.2em] text-gold uppercase">
          {eyebrow}
        </span>
      ) : null}
      <h2
        id={id}
        className="text-2xl text-balance text-foreground sm:text-3xl"
      >
        {title}
      </h2>
      {description ? (
        <p className="max-w-2xl text-pretty text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}
