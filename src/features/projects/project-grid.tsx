import { Reveal } from "@/components/common/reveal";
import { getDataProvider } from "@/lib/data";
import type { Project } from "@/types";
import { ProjectCard } from "./project-card";

export function ProjectGrid({ projects }: { projects: Project[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {projects.map((project, index) => (
        <Reveal key={project.slug} delay={index * 0.05}>
          <ProjectCard project={project} />
        </Reveal>
      ))}
    </div>
  );
}

/** Featured projects, sourced from the data provider — used on the landing. */
export function FeaturedProjects() {
  const projects = getDataProvider().getFeaturedProjects();
  return <ProjectGrid projects={projects} />;
}
