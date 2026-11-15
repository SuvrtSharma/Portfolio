"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * The dashboard's tabs. Each tab is its own page, so tabs are plain links:
 * shareable, crawlable and usable without JavaScript. This component only
 * marks the current one.
 */
export function DashboardNav({
  slug,
  views,
}: {
  slug: string;
  views: { id: string; label: string }[];
}) {
  const segment = useSelectedLayoutSegment();
  const current = segment ?? views[0]?.id;

  return (
    <nav aria-label="Dashboard sections" className="border-b border-gold/15">
      <ul className="-mb-px flex gap-1 overflow-x-auto [scrollbar-width:thin]">
        {views.map((view, i) => {
          const active = view.id === current;
          return (
            <li key={view.id} className="shrink-0">
              <Link
                href={i === 0 ? `/results/${slug}` : `/results/${slug}/${view.id}`}
                aria-current={active ? "page" : undefined}
                scroll={false}
                className={cn(
                  "inline-flex h-11 items-center border-b-2 px-3 text-sm whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold",
                  active
                    ? "border-gold text-foreground"
                    : "border-transparent text-muted-foreground hover:border-gold/40 hover:text-foreground",
                )}
              >
                {view.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
