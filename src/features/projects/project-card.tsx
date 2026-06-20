import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { Panel } from "@/components/common/surfaces";
import { isExternal } from "@/lib/url";
import { cn } from "@/lib/utils";
import type { Project } from "@/types";
import { statusLabels, statusStyles } from "./project-status";

export function ProjectCard({ project }: { project: Project }) {
  const storyHref = `/projects/${project.slug}`;

  return (
    <Panel className="flex h-full flex-col p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl text-foreground">
            <Link
              href={storyHref}
              className="transition-colors hover:text-gold focus-visible:text-gold focus-visible:outline-none"
            >
              {project.title}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {project.tagline}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium",
            statusStyles[project.status],
          )}
        >
          {statusLabels[project.status]}
        </span>
      </div>

      <ul className="mt-4 space-y-1.5">
        {project.highlights.slice(0, 4).map((highlight) => (
          <li
            key={highlight}
            className="flex items-start gap-2 text-sm text-foreground/80"
          >
            <Check className="mt-0.5 size-4 shrink-0 text-gold" />
            <span>{highlight}</span>
          </li>
        ))}
      </ul>

      <ul className="mt-5 flex flex-wrap gap-1.5">
        {project.tech.map((tech) => (
          <li
            key={tech}
            className="rounded-md border border-gold/15 bg-ocean-deep/50 px-2 py-0.5 text-[11px] tracking-wide text-foreground/80"
          >
            {tech}
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-wrap items-center gap-4 border-t border-gold/10 pt-4">
        <Link
          href={storyHref}
          className="inline-flex items-center gap-1 text-sm font-medium text-gold hover:underline focus-visible:underline"
        >
          Read the story
          <ArrowUpRight className="size-3.5" />
        </Link>
        {project.links?.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            {...(isExternal(link.href)
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            className="inline-flex items-center gap-1 text-sm font-medium text-foreground/70 hover:text-gold hover:underline"
          >
            {link.label}
            <ArrowUpRight className="size-3.5" />
          </Link>
        ))}
      </div>
    </Panel>
  );
}
