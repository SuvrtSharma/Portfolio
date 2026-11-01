import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { postLoaders } from "@/content/posts/index";
import { formatPostDate } from "@/features/blog/format-date";
import { PostCard } from "@/features/blog/post-card";
import { getActiveVocabulary } from "@/lib/active-theme";
import { getDataProvider } from "@/lib/data";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getDataProvider()
    .getPosts()
    .map((post) => ({ slug: post.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = getDataProvider().getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.summary,
    ...(post.origin?.relation === "republished"
      ? { alternates: { canonical: post.origin.url } }
      : {}),
    openGraph: {
      type: "article",
      title: post.title,
      description: post.summary,
      publishedTime: post.date,
      tags: post.tags,
    },
  };
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params;
  const data = getDataProvider();
  const post = data.getPostBySlug(slug);
  const loadPost = postLoaders[slug];
  if (!post || !loadPost) notFound();

  const vocab = getActiveVocabulary();
  const Body = (await loadPost()).default;
  const project = post.project ? data.getProjectBySlug(post.project) : undefined;
  const related = project
    ? data.getPostsByProject(project.slug).filter((p) => p.slug !== post.slug)
    : [];

  return (
    <>
      <SiteHeader
        brandName={data.getProfile().name}
        ctaLabel={vocab.exploreCta}
        ctaHref="/archipelago"
      />

      <main id="main" className="flex-1">
        <article className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-gold"
          >
            <ArrowLeft className="size-4" />
            Back to {vocab.journalTitle}
          </Link>

          <header className="mt-6">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <time dateTime={post.date}>{formatPostDate(post.date)}</time>
              {post.readingMinutes ? (
                <span>· {post.readingMinutes} min read</span>
              ) : null}
              {post.draft ? (
                <span className="rounded-full border border-gold/40 px-2 py-0.5 text-xs text-gold">
                  Draft (hidden in production)
                </span>
              ) : null}
            </div>

            {project ? (
              <Link
                href={`/blog#${project.slug}`}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.18em] text-gold uppercase hover:underline"
              >
                From the {project.shortTitle ?? project.title} project
              </Link>
            ) : null}

            <h1 className="mt-3 font-display text-3xl text-balance text-foreground sm:text-4xl">
              {post.title}
            </h1>
            <p className="mt-3 text-lg text-pretty text-foreground/85">
              {post.summary}
            </p>

            <ul className="mt-6 flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-md border border-gold/15 bg-ocean-panel/60 px-2 py-0.5 text-[11px] tracking-wide text-foreground/80"
                >
                  {tag}
                </li>
              ))}
            </ul>
          </header>

          {post.origin ? (
            <p className="mt-8 rounded-lg border border-gold/15 bg-ocean-panel/50 px-4 py-3 text-sm text-muted-foreground">
              {post.origin.relation === "republished"
                ? "Originally published on the "
                : "Adapted from a post I wrote for the "}
              <Link
                href={post.origin.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 font-medium text-gold hover:underline"
              >
                {post.origin.site}
                <ArrowUpRight className="size-3.5" />
              </Link>
            </p>
          ) : null}

          <div className="mt-10 border-t border-gold/10 pt-2">
            <Body />
          </div>

          {project && related.length ? (
            <section className="mt-14 border-t border-gold/15 pt-8">
              <p className="text-xs font-semibold tracking-[0.18em] text-gold uppercase">
                Keep reading
              </p>
              <h2 className="mt-1 font-display text-2xl text-foreground">
                More from {project.shortTitle ?? project.title}
              </h2>
              <ul className="mt-5 space-y-4">
                {related.map((p) => (
                  <li key={p.slug}>
                    <PostCard post={p} />
                  </li>
                ))}
              </ul>
              <Link
                href={`/projects/${project.slug}`}
                className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-gold hover:underline"
              >
                About the project
                <ArrowUpRight className="size-3.5" />
              </Link>
            </section>
          ) : null}
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
