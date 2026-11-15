import { resultSets } from "@/content/results";

export interface NavItem {
  label: string;
  href: string;
}

/** Results appear in the menu once at least one dashboard is published (drafts
 *  count outside production, the same rule the blog uses). */
const showResults =
  process.env.NODE_ENV !== "production" || resultSets.some((set) => !set.draft);

/** Primary navigation. Anchor links target landing sections; "Map" leaves to
 *  the interactive route. */
export const navItems: NavItem[] = [
  { label: "Map", href: "/archipelago" },
  { label: "Log", href: "/#log" },
  { label: "Projects", href: "/#projects" },
  { label: "Skills", href: "/#skills" },
  { label: "Blog", href: "/blog" },
  ...(showResults ? [{ label: "Results", href: "/results" }] : []),
  { label: "About", href: "/#about" },
  { label: "Contact", href: "/#contact" },
];
