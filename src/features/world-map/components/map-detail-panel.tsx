"use client";

import type { ReactNode } from "react";
import { Download, Mail } from "lucide-react";
import { SocialLinks } from "@/components/common/social-links";
import { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProjectCard } from "@/features/projects/project-card";
import { getDataProvider } from "@/lib/data";
import { Icon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { Project, WorldNode } from "@/types";

interface MapDetailPanelProps {
  node: WorldNode | null;
  onClose: () => void;
}

/**
 * Centered "takeover" card for the selected island. The map dims and blurs
 * behind it (handled by the engine), the card grows into the middle of the
 * screen, and it resolves the island's referenced projects, skills, and bug
 * stories through the data provider. Built on the base-ui Dialog so it keeps
 * focus-trapping, Esc-to-close, scroll-locking, and click-outside for free.
 */
export function MapDetailPanel({ node, onClose }: MapDetailPanelProps) {
  const data = getDataProvider();

  const projects: Project[] =
    node?.projectSlugs?.flatMap((slug) => {
      const project = data.getProjectBySlug(slug);
      return project ? [project] : [];
    }) ?? [];

  const skillGroups = node?.skillGroupIds
    ? data.getSkillGroups().filter((g) => node.skillGroupIds?.includes(g.id))
    : [];

  const bugs = node?.bugStoryIds
    ? data.getBugStoriesByIds(node.bugStoryIds)
    : [];

  const isHarbor = node?.category === "harbor";
  const profile = data.getProfile();

  return (
    <Dialog
      open={node !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className={cn(
          "max-h-[88svh] w-[calc(100%-1.5rem)] gap-0 overflow-hidden border border-gold/25 bg-ocean-deep/95 p-0 ring-1 ring-gold/10 sm:max-w-2xl",
          "data-open:zoom-in-95 motion-reduce:animate-none motion-reduce:transition-none",
        )}
      >
        {node ? (
          <div className="max-h-[88svh] overflow-y-auto">
            <div className="flex items-center gap-3 border-b border-gold/10 bg-ocean-panel/40 p-5 sm:p-6">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-ocean-deep text-gold shadow-lg shadow-gold/10 sm:size-14">
                <Icon name={node.iconKey} className="size-6" />
              </span>
              <div>
                <DialogTitle className="font-display text-2xl text-foreground">
                  {node.title}
                </DialogTitle>
                <DialogDescription className="text-xs tracking-widest text-gold/70 uppercase">
                  {node.category}
                </DialogDescription>
              </div>
            </div>

            <p className="px-5 pt-5 text-sm text-pretty text-muted-foreground sm:px-6">
              {node.summary}
            </p>

            {projects.length > 0 ? (
              <PanelSection title="Projects">
                <div className="space-y-4">
                  {projects.map((project) => (
                    <ProjectCard key={project.slug} project={project} />
                  ))}
                </div>
              </PanelSection>
            ) : null}

            {skillGroups.length > 0 ? (
              <PanelSection title="Skills">
                <div className="space-y-3">
                  {skillGroups.map((group) => (
                    <div key={group.id}>
                      <p className="text-xs font-semibold tracking-wide text-foreground/70 uppercase">
                        {group.label}
                      </p>
                      <ul className="mt-1.5 flex flex-wrap gap-1.5">
                        {group.skills.map((skill) => (
                          <li
                            key={skill}
                            className="rounded-md border border-gold/15 bg-ocean-panel/60 px-2 py-0.5 text-[11px] text-foreground/85"
                          >
                            {skill}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </PanelSection>
            ) : null}

            {bugs.length > 0 ? (
              <PanelSection title="Lessons from the Graveyard">
                <ul className="space-y-4">
                  {bugs.map((bug) => (
                    <li
                      key={bug.id}
                      className="rounded-lg border border-gold/10 bg-ocean-panel/50 p-4"
                    >
                      <p className="font-display text-base text-foreground">
                        {bug.title}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {bug.summary}
                      </p>
                      <p className="mt-2 text-sm text-gold/90">
                        <span className="font-semibold">Lesson:</span>{" "}
                        {bug.lesson}
                      </p>
                    </li>
                  ))}
                </ul>
              </PanelSection>
            ) : null}

            {isHarbor ? (
              <PanelSection title="Reach me">
                <div className="flex flex-col gap-3">
                  <a
                    href={`mailto:${profile.email}`}
                    className={cn(buttonVariants({ size: "lg" }), "gap-2")}
                  >
                    <Mail className="size-4" />
                    {profile.email}
                  </a>
                  {profile.resumeUrl ? (
                    <a
                      href={profile.resumeUrl}
                      download
                      className={cn(
                        buttonVariants({ variant: "outline", size: "lg" }),
                        "gap-2",
                      )}
                    >
                      <Download className="size-4" />
                      Download résumé
                    </a>
                  ) : null}
                  <SocialLinks className="pt-1" />
                </div>
              </PanelSection>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function PanelSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-gold/10 px-5 py-5 first-of-type:border-t-0 sm:px-6">
      <h3 className="mb-3 text-xs font-semibold tracking-[0.18em] text-gold uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}
