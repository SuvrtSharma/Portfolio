"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Icon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { navItems } from "./nav-config";

interface SiteHeaderProps {
  brandName: string;
  /** Primary CTA — varies by page (e.g. "Explore" on the landing, "Overview" on the map). */
  ctaLabel: string;
  ctaHref: string;
}

/** Sticky top navigation. Transparent over the hero, then a frosted ocean bar
 *  once scrolled. Collapses into a drawer on mobile. */
export function SiteHeader({ brandName, ctaLabel, ctaHref }: SiteHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-colors duration-300",
        scrolled
          ? "border-b border-gold/15 bg-ocean-deep/85 backdrop-blur"
          : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
        >
          <Icon
            name="compass"
            className="size-6 text-gold transition-transform duration-500 group-hover:rotate-45"
          />
          <span className="font-display text-lg tracking-wide text-foreground">
            {brandName}
          </span>
        </Link>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-1 md:flex"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm text-foreground/80 transition-colors hover:text-gold focus-visible:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href={ctaHref}
          className={cn(buttonVariants({ size: "lg" }), "hidden md:inline-flex")}
        >
          {ctaLabel}
        </Link>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger
              aria-label="Open menu"
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-72 border-gold/15 bg-ocean-deep/95"
            >
              <SheetTitle className="px-4 pt-4 font-display tracking-wide">
                {brandName}
              </SheetTitle>
              <nav
                aria-label="Mobile"
                className="flex flex-col gap-1 px-2 pt-2"
              >
                {navItems.map((item) => (
                  <SheetClose
                    key={item.href}
                    render={<Link href={item.href} />}
                    className="rounded-md px-3 py-2.5 text-base text-foreground/85 transition-colors hover:bg-accent hover:text-gold"
                  >
                    {item.label}
                  </SheetClose>
                ))}
              </nav>
              <div className="mt-2 px-4">
                <SheetClose
                  render={<Link href={ctaHref} />}
                  className={cn(buttonVariants({ size: "lg" }), "w-full")}
                >
                  {ctaLabel}
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
