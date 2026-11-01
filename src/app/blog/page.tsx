import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { groupPostsByProject } from "@/features/blog/group-posts";
import { PostCard } from "@/features/blog/post-card";
import { getActiveVocabulary } from "@/lib/active-theme";
import { getDataProvider } from "@/lib/data";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Technical writing on what I'm studying and what I've found: architecture, SQL Server, AI systems, and security.",
};

export default function BlogIndexPage() {
  const data = getDataProvider();
  const vocab = getActiveVocabulary();
  const groups = groupPostsByProject(data.getPosts(), (slug) =>
    data.getProjectBySlug(slug),
  );

  return (
    <>
      <SiteHeader
        brandName={data.getProfile().name}
        ctaLabel={vocab.exploreCta}
        ctaHref="/archipelago"
      />

      <main id="main" className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <header>
            <p className="text-xs font-semibold tracking-[0.18em] text-gold uppercase">
              {vocab.journalTitle}
            </p>
            <h1 className="mt-3 font-display text-3xl text-balance text-foreground sm:text-4xl">
              Notes from the deep end
            </h1>
            <p className="mt-3 text-lg text-pretty text-foreground/85">
              What I&apos;m studying, what I&apos;ve built, and what I&apos;ve
              found along the way.
            </p>

            {groups.length > 1 ? (
              <nav aria-label="Jump to project" className="mt-6 flex flex-wrap gap-2">
                {groups.map((group) => (
                  <a
                    key={group.project?.slug ?? "other"}
                    href={`#${group.project?.slug ?? "other"}`}
                    className="rounded-full border border-gold/25 px-3 py-1 text-sm text-foreground/85 transition-colors hover:border-gold/60 hover:text-gold"
                  >
                    {group.project ? (group.project.shortTitle ?? group.project.title) : "Other writing"}
                    <span className="ml-1.5 text-muted-foreground">
                      {group.posts.length}
                    </span>
                  </a>
                ))}
              </nav>
            ) : null}
          </header>

          {groups.length === 0 ? (
            <p className="mt-12 rounded-lg border border-gold/15 bg-ocean-panel/50 p-5 text-muted-foreground">
              The first entry is still being written. Check back soon.
            </p>
          ) : (
            groups.map((group) => (
              <section
                key={group.project?.slug ?? "other"}
                id={group.project?.slug ?? "other"}
                className="mt-12 scroll-mt-24"
              >
                <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b border-gold/15 pb-3">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.18em] text-gold uppercase">
                      {group.project ? "From the project" : "General"}
                    </p>
                    <h2 className="mt-1 font-display text-2xl text-foreground">
                      {group.project ? (group.project.shortTitle ?? group.project.title) : "Other writing"}
                    </h2>
                    {group.project ? (
                      <p className="mt-1 text-sm text-pretty text-muted-foreground">
                        {group.project.tagline}
                      </p>
                    ) : null}
                  </div>
                  {group.project ? (
                    <Link
                      href={`/projects/${group.project.slug}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-gold hover:underline"
                    >
                      About the project
                      <ArrowRight className="size-3.5" />
                    </Link>
                  ) : null}
                </div>

                <ul className="mt-5 space-y-4">
                  {group.posts.map((post) => (
                    <li key={post.slug}>
                      <PostCard post={post} />
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
