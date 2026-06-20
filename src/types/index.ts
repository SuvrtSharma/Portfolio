/** Barrel for the domain types. Import from `@/types` everywhere. */
export type { Vec2 } from "./geometry";
export type {
  BugSeverity,
  BugStory,
  LogEntry,
  MediaAsset,
  Profile,
  Project,
  ProjectLink,
  ProjectLinkKind,
  ProjectStatus,
  SkillGroup,
  SocialKind,
  SocialLink,
} from "./content";
export type {
  NodeCategory,
  World,
  WorldEdge,
  WorldNode,
} from "./world";
export type {
  NodeMarkerProps,
  PanelFrameProps,
  ThemeDefinition,
  ThemeId,
  ThemeSlots,
  ThemeVocabulary,
} from "./theme";
export type { IWorldDataProvider } from "./data-provider";
