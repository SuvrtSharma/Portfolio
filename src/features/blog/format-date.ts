/** Formats an ISO `YYYY-MM-DD` date for display. Pinned to UTC so the server's
 *  timezone can never shift a post onto the previous day. */
export function formatPostDate(iso: string): string {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}
