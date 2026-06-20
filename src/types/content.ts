/**
 * Domain content types. These are deliberately theme-agnostic: nothing here
 * mentions pirates, islands, or any visual flavour. A theme decorates this
 * data; it never defines it.
 */

export type ProjectStatus = "shipped" | "in-progress" | "experiment" | "archived";

export interface MediaAsset {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export type ProjectLinkKind = "repo" | "live" | "case-study" | "docs" | "other";

export interface ProjectLink {
  label: string;
  href: string;
  kind: ProjectLinkKind;
}

export interface Project {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  highlights: string[];
  tech: string[];
  status: ProjectStatus;
  year?: number;
  cover?: MediaAsset;
  gallery?: MediaAsset[];
  links?: ProjectLink[];
  /** Surfaced on the quick-skim landing page when true. */
  featured?: boolean;
}

export interface SkillGroup {
  id: string;
  /** e.g. "Frontend", "Backend / APIs". */
  label: string;
  iconKey?: string;
  skills: string[];
}

export interface LogEntry {
  id: string;
  /** Year or free-form period label. */
  year: number | string;
  title: string;
  description: string;
  iconKey?: string;
}

export type BugSeverity = "low" | "medium" | "high" | "legendary";

export interface BugStory {
  id: string;
  title: string;
  summary: string;
  /** The takeaway — what the failure taught. */
  lesson: string;
  severity: BugSeverity;
  tech?: string[];
}

export type SocialKind =
  | "github"
  | "linkedin"
  | "email"
  | "phone"
  | "resume"
  | "twitter"
  | "website"
  | "other";

export interface SocialLink {
  label: string;
  href: string;
  kind: SocialKind;
}

export interface Profile {
  name: string;
  role: string;
  tagline: string;
  bio: string;
  location?: string;
  email: string;
  phone?: string;
  avatar?: MediaAsset;
  resumeUrl?: string;
  socials: SocialLink[];
}
