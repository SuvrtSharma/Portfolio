/** Number and date formatting shared by every dashboard. Display only: these
 *  never change a value, they only decide how many digits are shown. */

const grouped = (digits: number) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

const int = grouped(0);
const one = grouped(1);
const two = grouped(2);
const three = grouped(3);

export const fmtInt = (n: number) => int.format(n);
export const fmt1 = (n: number) => one.format(n);
export const fmt2 = (n: number) => two.format(n);
export const fmt3 = (n: number) => three.format(n);
export const fmtRatio = (n: number) => `${two.format(n)}×`;
export const fmtPercent = (share: number) => `${one.format(share * 100)}%`;

/** "14 Nov 2026" from an ISO date or timestamp. */
export function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

/** Byte counts as "125.1 KB". */
export function fmtBytes(n: number): string {
  return n < 1024 ? `${fmtInt(n)} B` : `${fmt1(n / 1024)} KB`;
}
