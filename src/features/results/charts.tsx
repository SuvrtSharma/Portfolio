import type { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Charts drawn with HTML and a little SVG, no charting library: positions are
 * percentages of the plot width, so text stays at its real size on a phone and
 * the chart never needs JavaScript to lay itself out. Every chart here has the
 * same figures in a table nearby, for screen readers and for checking.
 */

/** Round axis ticks: 0 and a few steps of 1, 2, 2.5 or 5 × 10ⁿ up to `max`. */
export function niceTicks(max: number, target = 5): number[] {
  if (max <= 0) return [0];
  const raw = max / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  const ticks: number[] = [];
  for (let v = 0; v <= max + step * 1e-9; v += step) ticks.push(Number(v.toFixed(10)));
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}

const pct = (v: number, max: number) => `${(v / max) * 100}%`;

/* ------------------------------------------------------------------ range chart */

export interface RangeRow {
  key: string;
  label: ReactNode;
  /** Text colour class for the row's marks, e.g. "text-positive". */
  color: string;
  points: { value: number; label: string }[];
  /** Where the median tick goes. */
  center: number;
  aside: ReactNode;
}

/** The plot area of one range-chart row: gridlines and the reference band. */
function Track({
  ticks,
  top,
  band,
  children,
  className,
}: {
  ticks: number[];
  top: number;
  band?: { from: number; to: number };
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      {ticks.map((t) => (
        <span key={t} aria-hidden className="absolute inset-y-0 w-px bg-gold/10" style={{ left: pct(t, top) }} />
      ))}
      {band ? (
        <span
          aria-hidden
          className="absolute inset-y-0 border-x border-gold/35 bg-gold/[0.1]"
          style={{ left: pct(band.from, top), width: pct(band.to - band.from, top) }}
        />
      ) : null}
      {children}
    </div>
  );
}

/**
 * One row per series: every point as a dot, a line from the lowest to the
 * highest, a tick at the median, and a shaded reference band behind all rows.
 */
export function RangeChart({
  rows,
  band,
  bandLabel,
  unit,
  ariaLabel,
}: {
  rows: RangeRow[];
  band?: { from: number; to: number };
  bandLabel?: string;
  unit: string;
  ariaLabel: string;
}) {
  const max = Math.max(...rows.flatMap((r) => r.points.map((p) => p.value)));
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1];

  // Each row is its own grid with fixed side columns, so the plots line up.
  // On a phone the name and value share a line and the plot gets the full
  // width below them; from `sm` up, name | plot | value sit side by side.
  const rowGrid =
    "grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 [grid-template-areas:'label_aside'_'track_track'] sm:grid-cols-[10.5rem_minmax(0,1fr)_5.5rem] sm:[grid-template-areas:'label_track_aside']";

  return (
    <figure aria-label={ariaLabel} className="min-w-0">
      <div className="text-sm">
        {rows.map((row) => (
          <div key={row.key} className={cn(rowGrid, "border-b border-gold/[0.06] py-1 last:border-b-0 sm:border-b-0 sm:py-0")}>
            <div className="flex items-center pt-2 pr-1 text-foreground/90 [grid-area:label] sm:py-2">{row.label}</div>
            <Track ticks={ticks} top={top} band={band} className="min-h-10 [grid-area:track]">
              <span
                aria-hidden
                className={cn("absolute top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-current opacity-60", row.color)}
                style={{ left: pct(Math.min(...row.points.map((p) => p.value)), top), width: pct(Math.max(...row.points.map((p) => p.value)) - Math.min(...row.points.map((p) => p.value)), top) }}
              />
              <span
                aria-hidden
                className={cn("absolute top-1/2 h-5 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-current", row.color)}
                style={{ left: pct(row.center, top) }}
              />
              {row.points.map((p) => (
                <Tooltip key={p.label}>
                  <TooltipTrigger
                    aria-label={p.label}
                    className={cn(
                      "absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 cursor-default rounded-full border-2 border-current bg-ocean-deep outline-none hover:scale-125 focus-visible:ring-2 focus-visible:ring-gold",
                      row.color,
                    )}
                    style={{ left: pct(p.value, top) }}
                  />
                  <TooltipContent>{p.label}</TooltipContent>
                </Tooltip>
              ))}
            </Track>
            <div className="flex items-center justify-end pt-2 text-right tabular-nums [grid-area:aside] sm:py-2">{row.aside}</div>
          </div>
        ))}
        <div className={rowGrid}>
        <Track ticks={ticks} top={top} band={band} className="h-6 text-[11px] text-muted-foreground [grid-area:track]">
          {ticks.map((t, i) => (
            <span
              key={t}
              className={cn(
                "absolute top-1.5 tabular-nums",
                i === 0 ? "" : i === ticks.length - 1 ? "-translate-x-full" : "-translate-x-1/2",
              )}
              style={{ left: pct(t, top) }}
            >
              {new Intl.NumberFormat("en-US").format(t)}
            </span>
          ))}
        </Track>
        <div className="hidden items-center text-[11px] text-muted-foreground [grid-area:aside] sm:flex">{unit}</div>
        </div>
      </div>
      <p className="mt-1 text-right text-[11px] text-muted-foreground sm:hidden">{unit}</p>
      {band && bandLabel ? (
        <figcaption className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="inline-block h-3 w-5 border-x border-gold/35 bg-gold/[0.1]" />
            {bandLabel}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="inline-block size-3 rounded-full border-2 border-foreground/70" />
            One round
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="inline-block h-3 w-[3px] rounded-full bg-foreground/70" />
            Median of the rounds
          </span>
        </figcaption>
      ) : null}
    </figure>
  );
}

/* ------------------------------------------------------------------ line chart */

export interface LineSeries {
  name: string;
  /** A CSS colour, normally a theme variable such as "var(--chart-2)". */
  color: string;
  values: number[];
}

/**
 * Lines over an evenly spaced x axis (one point per second). The SVG stretches
 * to the box; strokes keep their width and the labels are HTML, so nothing
 * distorts at any width.
 */
export function LineChart({
  series,
  xLabel,
  yLabel,
  ariaLabel,
  height = "h-56",
}: {
  series: LineSeries[];
  xLabel: (i: number) => string;
  yLabel: string;
  ariaLabel: string;
  height?: string;
}) {
  const n = Math.max(...series.map((s) => s.values.length));
  const max = Math.max(...series.flatMap((s) => s.values));
  const yTicks = niceTicks(max, 4);
  const top = yTicks[yTicks.length - 1];
  const xStep = Math.max(1, Math.ceil(n / 6 / 5) * 5);
  const xTicks = Array.from({ length: n }, (_, i) => i).filter((i) => i % xStep === 0);
  const x = (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * 100);
  const y = (v: number) => 100 - (v / top) * 100;

  return (
    <figure aria-label={ariaLabel} className="min-w-0">
      <div className="flex items-stretch gap-2">
        <div className={cn("relative w-9 shrink-0 text-right text-[11px] text-muted-foreground tabular-nums", height)}>
          {yTicks.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2" style={{ top: `${y(t)}%` }}>
              {new Intl.NumberFormat("en-US").format(t)}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className={cn("relative", height)}>
            <svg className="absolute inset-0 size-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              {yTicks.map((t) => (
                <line key={t} x1="0" x2="100" y1={y(t)} y2={y(t)} stroke="var(--border)" vectorEffect="non-scaling-stroke" />
              ))}
              {series.map((s) => (
                <polyline
                  key={s.name}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
                />
              ))}
            </svg>
          </div>
          <div className="relative mt-1 h-4 text-[11px] text-muted-foreground tabular-nums">
            {xTicks.map((i) => (
              <span key={i} className="absolute -translate-x-1/2" style={{ left: `${x(i)}%` }}>
                {xLabel(i)}
              </span>
            ))}
          </div>
        </div>
      </div>
      <figcaption className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        {series.map((s) => (
          <span key={s.name} className="inline-flex items-center gap-1.5">
            <span aria-hidden className="inline-block h-0.5 w-4 rounded-full" style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
        <span className="ml-auto">{yLabel}</span>
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ share bar */

/** One bar split into labelled shares, e.g. the operation mix. */
export function ShareBar({ parts }: { parts: { key: string; label: string; share: number; color: string; detail: string }[] }) {
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full" aria-hidden>
        {parts.map((p) => (
          <span key={p.key} className="h-full border-r-2 border-ocean-panel last:border-r-0" style={{ width: `${p.share * 100}%`, background: p.color }} />
        ))}
      </div>
      <ul className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-x-4 gap-y-2.5 text-sm">
        {parts.map((p) => (
          <li key={p.key} className="flex items-start gap-2">
            <span aria-hidden className="mt-1.5 inline-block size-2.5 shrink-0 rounded-full" style={{ background: p.color }} />
            <span>
              <span className="text-foreground">{p.label}</span>
              <span className="block text-xs text-muted-foreground tabular-nums">{p.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
