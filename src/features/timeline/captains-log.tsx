import { getDataProvider } from "@/lib/data";
import { Icon } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface CaptainsLogProps {
  /** Show only the first N entries (used for the landing preview). */
  limit?: number;
  className?: string;
}

/** Vertical career timeline. The connector line is built from per-item
 *  segments so it always matches content height. */
export function CaptainsLog({ limit, className }: CaptainsLogProps) {
  const entries = getDataProvider().getLogEntries();
  const shown = limit ? entries.slice(0, limit) : entries;

  return (
    <ol className={cn("", className)}>
      {shown.map((entry, index) => {
        const isLast = index === shown.length - 1;
        return (
          <li key={entry.id} className="grid grid-cols-[auto_1fr] gap-x-4">
            <div className="flex flex-col items-center">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-ocean-panel text-gold">
                <Icon name={entry.iconKey ?? "log"} className="size-4" />
              </span>
              {!isLast ? <span className="my-1 w-px grow bg-gold/20" /> : null}
            </div>
            <div className={cn("pb-8", isLast && "pb-0")}>
              <p className="text-xs font-semibold tracking-widest text-gold/80 uppercase">
                {entry.year}
              </p>
              <h3 className="mt-0.5 font-display text-lg leading-tight text-foreground">
                {entry.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {entry.description}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
