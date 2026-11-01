import type { Post, Project } from "@/types";

export interface PostGroup {
  /** Undefined for the "other writing" group of posts tied to no project. */
  project?: Project;
  posts: Post[];
}

/**
 * Groups posts (already sorted newest first) by the project they came out of.
 * Project groups are ordered by their newest post; posts with no project, or
 * pointing at a project that doesn't exist, go in a final ungrouped bucket.
 */
export function groupPostsByProject(
  posts: Post[],
  findProject: (slug: string) => Project | undefined,
): PostGroup[] {
  const groups = new Map<string, PostGroup>();
  const other: Post[] = [];

  for (const post of posts) {
    const project = post.project ? findProject(post.project) : undefined;
    if (!project) {
      other.push(post);
      continue;
    }
    const group = groups.get(project.slug) ?? { project, posts: [] };
    group.posts.push(post);
    groups.set(project.slug, group);
  }

  const result = [...groups.values()];
  if (other.length) result.push({ posts: other });
  return result;
}
