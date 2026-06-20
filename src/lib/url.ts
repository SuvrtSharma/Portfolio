/** True for absolute http(s) URLs that should open in a new tab. */
export function isExternal(href: string): boolean {
  return /^https?:\/\//i.test(href);
}
