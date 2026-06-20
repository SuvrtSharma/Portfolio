import Link from "next/link";
import { Ornament } from "@/components/common/ornament";
import { SocialLinks } from "@/components/common/social-links";
import { getDataProvider } from "@/lib/data";
import { Icon } from "@/lib/icons";

export function SiteFooter() {
  const profile = getDataProvider().getProfile();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-gold/10 bg-ocean-deep">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <Ornament icon="anchor" className="mb-10" />
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
            >
              <Icon name="compass" className="size-5 text-gold" />
              <span className="font-display text-base tracking-wide text-foreground">
                {profile.name}
              </span>
            </Link>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              {profile.role}
              {profile.location ? ` · ${profile.location}` : ""}
            </p>
          </div>
          <SocialLinks />
        </div>
        <p className="mt-8 text-xs text-muted-foreground">
          © {year} {profile.name}. Charted with Next.js, Tailwind, and a good
          compass.
        </p>
      </div>
    </footer>
  );
}
