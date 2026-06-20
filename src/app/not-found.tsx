import Link from "next/link";
import { Ornament } from "@/components/common/ornament";
import { buttonVariants } from "@/components/ui/button";
import { Icon } from "@/lib/icons";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main
      id="main"
      className="flex flex-1 items-center justify-center px-4 py-24"
    >
      <div className="mx-auto max-w-lg text-center">
        <Icon name="compass" className="mx-auto size-16 text-gold/70" />
        <p className="mt-6 text-xs font-semibold tracking-[0.3em] text-gold uppercase">
          Lost at sea
        </p>
        <h1 className="mt-3 font-display text-4xl text-foreground">
          404 — Off the map
        </h1>
        <p className="mt-4 text-pretty text-muted-foreground">
          This stretch of ocean isn&apos;t charted. Let&apos;s get you back to
          safe waters.
        </p>
        <Ornament icon="anchor" className="mx-auto my-8 max-w-xs" />
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className={cn(buttonVariants({ size: "lg" }))}>
            Back to shore
          </Link>
          <Link
            href="/archipelago"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            Explore the map
          </Link>
        </div>
      </div>
    </main>
  );
}
