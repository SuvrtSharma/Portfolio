import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/common/json-ld";
import { Ornament } from "@/components/common/ornament";
import { Reveal } from "@/components/common/reveal";
import { Section } from "@/components/common/section";
import { SectionHeading } from "@/components/common/section-heading";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { buttonVariants } from "@/components/ui/button";
import { Harbor } from "@/features/contact/harbor";
import { Hero } from "@/features/landing/hero";
import { FeaturedProjects } from "@/features/projects/project-grid";
import { SkillsGrid } from "@/features/skills/skills-grid";
import { CaptainsLog } from "@/features/timeline/captains-log";
import { getActiveVocabulary } from "@/lib/active-theme";
import { getDataProvider } from "@/lib/data";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const vocab = getActiveVocabulary();
  const profile = getDataProvider().getProfile();

  return (
    <>
      <JsonLd />
      <SiteHeader
        brandName={profile.name}
        ctaLabel={vocab.exploreCta}
        ctaHref="/archipelago"
      />

      <main id="main" className="flex-1">
        <Hero />

        <Section id="log" aria-labelledby="log-heading">
          <SectionHeading
            id="log-heading"
            eyebrow={vocab.logTitle}
            title="The journey so far"
            description="Milestones from monoliths to cloud-native — the short version."
          />
          <Reveal className="mt-10 max-w-2xl">
            <CaptainsLog />
          </Reveal>
        </Section>

        <Section
          id="skills"
          aria-labelledby="skills-heading"
          className="bg-ocean/40"
        >
          <SectionHeading
            id="skills-heading"
            eyebrow="Tech Stack"
            title="Tools of the trade"
            description="The languages, frameworks, and platforms I reach for."
            className="mb-10"
          />
          <SkillsGrid />
        </Section>

        <Section id="projects" aria-labelledby="projects-heading">
          <SectionHeading
            id="projects-heading"
            eyebrow="Featured Projects"
            title="Islands worth visiting"
            description="A few things I've built. The full archipelago holds the rest."
            className="mb-10"
          />
          <FeaturedProjects />
          <Reveal className="mt-8">
            <Link
              href="/archipelago"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "gap-2",
              )}
            >
              Explore every island on the map
              <ArrowRight className="size-4" />
            </Link>
          </Reveal>
        </Section>

        <Section id="contact" aria-labelledby="contact-heading">
          <SectionHeading
            id="contact-heading"
            align="center"
            eyebrow={vocab.harborTitle}
            title="Get in touch"
            className="mb-10 items-center"
          />
          <Ornament icon="ship" className="mx-auto mb-10 max-w-xs" />
          <Harbor />
        </Section>
      </main>

      <SiteFooter />
    </>
  );
}
