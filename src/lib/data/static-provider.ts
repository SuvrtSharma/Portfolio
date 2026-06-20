import type {
  BugStory,
  IWorldDataProvider,
  LogEntry,
  Profile,
  Project,
  SkillGroup,
  World,
} from "@/types";
import {
  bugStories,
  logEntries,
  profile,
  projects,
  skillGroups,
  world,
} from "@/content";

/**
 * Default content source: typed config compiled into the bundle. Fully static,
 * so every page can be statically generated and served from a CDN.
 *
 * To back the site with a CMS or the SaaS builder's API, implement
 * {@link IWorldDataProvider} elsewhere and swap it in `getDataProvider()` — no
 * consumer changes.
 */
export class StaticWorldDataProvider implements IWorldDataProvider {
  getProfile(): Profile {
    return profile;
  }

  getWorld(): World {
    return world;
  }

  getProjects(): Project[] {
    return projects;
  }

  getProjectBySlug(slug: string): Project | undefined {
    return projects.find((project) => project.slug === slug);
  }

  getFeaturedProjects(): Project[] {
    return projects.filter((project) => project.featured);
  }

  getSkillGroups(): SkillGroup[] {
    return skillGroups;
  }

  getLogEntries(): LogEntry[] {
    return logEntries;
  }

  getBugStories(): BugStory[] {
    return bugStories;
  }

  getBugStoriesByIds(ids: string[]): BugStory[] {
    const wanted = new Set(ids);
    return bugStories.filter((story) => wanted.has(story.id));
  }
}
