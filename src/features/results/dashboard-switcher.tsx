"use client";

import Link from "next/link";
import { Menu } from "@base-ui/react/menu";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Picks which dashboard to open. Lists every result set, so a reader can move
 * between dashboards without going back to the index.
 */
export function DashboardSwitcher({
  current,
  options,
}: {
  current: string;
  options: { slug: string; name: string; date: string }[];
}) {
  const active = options.find((o) => o.slug === current);

  return (
    <Menu.Root>
      <Menu.Trigger
        className="inline-flex h-9 items-center gap-2 rounded-md border border-gold/25 bg-ocean-panel/60 pr-2 pl-3 text-sm text-foreground transition-colors hover:border-gold/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold data-[popup-open]:border-gold/60"
      >
        <span className="text-muted-foreground">Dashboard</span>
        <span className="font-medium">{active?.name ?? current}</span>
        <ChevronsUpDown className="size-3.5 text-gold" aria-hidden />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={6} align="start" className="z-50 outline-none">
          <Menu.Popup className="min-w-64 origin-(--transform-origin) rounded-md border border-gold/20 bg-popover p-1 text-sm text-popover-foreground shadow-[0_12px_32px_rgba(0,0,0,0.5)] outline-none data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 transition-opacity">
            <p className="px-2.5 pt-1.5 pb-1 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              Open a dashboard
            </p>
            {options.map((o) => (
              <Menu.LinkItem
                key={o.slug}
                render={<Link href={`/results/${o.slug}`} />}
                aria-current={o.slug === current ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-sm px-2.5 py-2 outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
                )}
              >
                <span className="flex-1">
                  <span className="block font-medium">{o.name}</span>
                  <span className="block text-xs text-muted-foreground">Run of {o.date}</span>
                </span>
                {o.slug === current ? <Check className="size-4 text-gold" aria-hidden /> : null}
              </Menu.LinkItem>
            ))}
            <Menu.Separator className="my-1 h-px bg-gold/15" />
            <Menu.LinkItem
              render={<Link href="/results" />}
              className="block rounded-sm px-2.5 py-2 text-muted-foreground outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
            >
              All results
            </Menu.LinkItem>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
