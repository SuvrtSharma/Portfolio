import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import { Reveal } from "@/components/common/reveal";
import { SocialLinks } from "@/components/common/social-links";
import { Parchment } from "@/components/common/surfaces";
import { buttonVariants } from "@/components/ui/button";
import { getActiveVocabulary } from "@/lib/active-theme";
import { getDataProvider } from "@/lib/data";
import { Icon } from "@/lib/icons";
import { cn } from "@/lib/utils";

export function Hero() {
  const profile = getDataProvider().getProfile();
  const vocab = getActiveVocabulary();

  return (
    <section
      id="about"
      aria-labelledby="hero-title"
      className="relative overflow-hidden"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,rgba(212,175,55,0.12),transparent_60%)]" />
        <Icon
          name="compass"
          className="absolute -top-10 -right-20 size-[30rem] text-gold/[0.04]"
        />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 pt-16 pb-12 sm:px-6 sm:pt-24 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-12 lg:px-8 lg:pt-28">
        {/* Critical above-the-fold content renders statically (no JS gate) to
            protect LCP and stay visible without JavaScript. */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-ocean-panel/60 px-3 py-1 text-xs font-medium tracking-[0.2em] text-gold uppercase">
            <Icon name="anchor" className="size-3.5" />
            {profile.role}
          </span>

          <h1
            id="hero-title"
            className="mt-5 text-4xl text-balance text-foreground sm:text-5xl lg:text-6xl"
          >
            {profile.name}
          </h1>

          <p className="mt-4 max-w-xl text-lg text-pretty text-foreground/85">
            {profile.tagline}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/archipelago"
              className={cn(buttonVariants({ size: "lg" }), "h-11 gap-2 px-6 text-base")}
            >
              {vocab.exploreCta}
              <ArrowRight className="size-4" />
            </Link>
            {profile.resumeUrl ? (
              <a
                href={profile.resumeUrl}
                download
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-11 gap-2 px-6 text-base",
                )}
              >
                <Download className="size-4" />
                Résumé
              </a>
            ) : null}
            <SocialLinks className="ml-1" />
          </div>
        </div>

        <Reveal delay={0.12} className="lg:justify-self-end">
          <Parchment className="max-w-md p-6 sm:p-8">
            <p className="font-display text-xs tracking-[0.3em] text-wood/70 uppercase">
              Welcome to
            </p>
            <p className="mt-2 font-display text-2xl leading-tight text-ink">
              {vocab.worldName}
            </p>
            <p className="text-sm font-medium text-wood">
              — of a Software Engineer —
            </p>
            <div className="my-5 h-px bg-parchment-dark/60" />
            <p className="text-pretty text-sm leading-relaxed text-ink/80">
              {profile.bio}
            </p>
            <p className="mt-6 text-right font-script text-3xl leading-none text-wood">
              {profile.name}
            </p>
          </Parchment>
        </Reveal>
      </div>
    </section>
  );
}
