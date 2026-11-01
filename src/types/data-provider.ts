import type {
  BugStory,
  LogEntry,
  Post,
  Profile,
  Project,
  SkillGroup,
} from "./content";
import type { World } from "./world";

/**
 * The single inversion-of-control boundary for all portfolio content.
 *
 * Every feature (map engine, landing sections, detail panels) depends on this
 * interface, never on a concrete source. Today the implementation is static
 * typed config; tomorrow it can be a CMS, a database, or the SaaS builder's API
 * — without touching a single consumer (Dependency Inversion).
 */
export interface IWorldDataProvider {
  getProfile(): Profile;
  getWorld(): World;
  getProjects(): Project[];
  getProjectBySlug(slug: string): Project | undefined;
  getFeaturedProjects(): Project[];
  getSkillGroups(): SkillGroup[];
  getLogEntries(): LogEntry[];
  getBugStories(): BugStory[];
  getBugStoriesByIds(ids: string[]): BugStory[];
  /** Published posts, newest first. Drafts are included only outside production. */
  getPosts(): Post[];
  getPostBySlug(slug: string): Post | undefined;
  /** Published posts written about one project, newest first. */
  getPostsByProject(projectSlug: string): Post[];
}
