import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { WorldMap } from "@/features/world-map/world-map";
import { getActiveVocabulary } from "@/lib/active-theme";
import { getDataProvider } from "@/lib/data";

const vocab = getActiveVocabulary();

export const metadata: Metadata = {
  title: vocab.worldNameShort,
  description: `Explore ${vocab.worldName} — an interactive map of the domains, projects, and lessons across my work.`,
};

export default function ArchipelagoPage() {
  const data = getDataProvider();
  const world = data.getWorld();
  const profile = data.getProfile();

  return (
    <>
      <SiteHeader
        brandName={profile.name}
        ctaLabel={vocab.skimCta}
        ctaHref="/"
      />
      <main id="main" className="flex-1">
        <h1 className="sr-only">
          {vocab.worldName} — {profile.name}
        </h1>
        <WorldMap world={world} />
      </main>
    </>
  );
}
