export interface NavItem {
  label: string;
  href: string;
}

/** Primary navigation. Anchor links target landing sections; "Map" leaves to
 *  the interactive route. */
export const navItems: NavItem[] = [
  { label: "Map", href: "/archipelago" },
  { label: "Log", href: "/#log" },
  { label: "Projects", href: "/#projects" },
  { label: "Skills", href: "/#skills" },
  { label: "About", href: "/#about" },
  { label: "Contact", href: "/#contact" },
];
