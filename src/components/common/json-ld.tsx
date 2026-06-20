import { siteConfig } from "@/config/site";
import { getDataProvider } from "@/lib/data";
import { isExternal } from "@/lib/url";

/** Person + WebSite structured data for richer search results. */
export function JsonLd() {
  const profile = getDataProvider().getProfile();

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        name: profile.name,
        jobTitle: profile.role,
        description: profile.tagline,
        email: `mailto:${profile.email}`,
        url: siteConfig.url,
        ...(profile.location
          ? {
              address: {
                "@type": "PostalAddress",
                addressLocality: profile.location,
              },
            }
          : {}),
        sameAs: profile.socials
          .filter((social) => isExternal(social.href))
          .map((social) => social.href),
      },
      {
        "@type": "WebSite",
        name: siteConfig.name,
        url: siteConfig.url,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
