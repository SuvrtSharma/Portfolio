import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Check } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { storyLoaders } from "@/content/stories";
import { PostCard } from "@/features/blog/post-card";
import { statusLabels, statusStyles } from "@/features/projects/project-status";
import { getActiveVocabulary } from "@/lib/active-theme";
import { getDataProvider } from "@/lib/data";
import { isExternal } from "@/lib/url";
import { cn } from "@/lib/utils";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getDataProvider()
    .getProjects()
    .map((project) => ({ slug: project.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const project = getDataProvider().getProjectBySlug(slug);
  if (!project) return {};
  return { title: project.title, description: project.tagline };
}

export default async function ProjectStoryPage({ params }: Params) {
  const { slug } = await params;
  const data = getDataProvider();
  const project = data.getProjectBySlug(slug);
  if (!project) notFound();

  const vocab = getActiveVocabulary();
  const loadStory = storyLoaders[slug];
  const Story = loadStory ? (await loadStory()).default : null;
  const posts = data.getPostsByProject(project.slug);

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
            href="/#projects"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-gold"
          >
            <ArrowLeft className="size-4" />
            Back to projects
          </Link>

          <header className="mt-6">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  statusStyles[project.status],
                )}
              >
                {statusLabels[project.status]}
              </span>
              {project.year ? (
                <span className="text-sm text-muted-foreground">
                  {project.year}
                </span>
              ) : null}
            </div>

            <h1 className="mt-3 font-display text-3xl text-balance text-foreground sm:text-4xl">
              {project.title}
            </h1>
            <p className="mt-3 text-lg text-pretty text-foreground/85">
              {project.tagline}
            </p>
            <p className="mt-4 text-pretty text-muted-foreground">
              {project.description}
            </p>

            <ul className="mt-6 flex flex-wrap gap-1.5">
              {project.tech.map((tech) => (
                <li
                  key={tech}
                  className="rounded-md border border-gold/15 bg-ocean-panel/60 px-2 py-0.5 text-[11px] tracking-wide text-foreground/80"
                >
                  {tech}
                </li>
              ))}
            </ul>

            {project.links?.length ? (
              <div className="mt-5 flex flex-wrap gap-4">
                {project.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    {...(isExternal(link.href)
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="inline-flex items-center gap-1 text-sm font-medium text-gold hover:underline"
                  >
                    {link.label}
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                ))}
              </div>
            ) : null}
          </header>

          <section className="mt-8 rounded-lg border border-gold/15 bg-ocean-panel/50 p-5">
            <h2 className="text-xs font-semibold tracking-[0.18em] text-gold uppercase">
              Highlights
            </h2>
            <ul className="mt-3 space-y-2">
              {project.highlights.map((highlight) => (
                <li
                  key={highlight}
                  className="flex items-start gap-2 text-sm text-foreground/85"
                >
                  <Check className="mt-0.5 size-4 shrink-0 text-gold" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </section>

          {Story ? (
            <div className="mt-10 border-t border-gold/10 pt-2">
              <Story />
            </div>
          ) : null}

          {posts.length ? (
            <section className="mt-14 border-t border-gold/15 pt-8">
              <p className="text-xs font-semibold tracking-[0.18em] text-gold uppercase">
                Writing
              </p>
              <h2 className="mt-1 font-display text-2xl text-foreground">
                What I learned building this
              </h2>
              <ul className="mt-5 space-y-4">
                {posts.map((post) => (
                  <li key={post.slug}>
                    <PostCard post={post} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
