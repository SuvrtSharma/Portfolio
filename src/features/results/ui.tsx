import type { ComponentProps, ReactNode } from "react";
import { ArrowUpRight, FileJson } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The building blocks every dashboard is made of. Server components only:
 * they render HTML, ship no JavaScript, and take their colours from theme
 * tokens, so a re-themed site restyles the dashboards too.
 */

/* ------------------------------------------------------------------ layout */

/** A titled band of a dashboard view. */
export function ViewSection({
  id,
  title,
  intro,
  children,
  className,
}: {
  id: string;
  title: ReactNode;
  intro?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn("scroll-mt-24", className)}>
      <h2 id={`${id}-title`} className="font-display text-xl text-foreground sm:text-2xl">
        {title}
      </h2>
      {intro ? <div className="mt-2 max-w-3xl text-pretty text-foreground/80">{intro}</div> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** A bordered card holding one figure, chart or table, with its source below. */
export function Card({
  id,
  title,
  description,
  source,
  children,
  className,
  bodyClassName,
}: {
  id?: string;
  title?: ReactNode;
  description?: ReactNode;
  source?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div
      id={id}
      className={cn("flex min-w-0 flex-col rounded-lg border border-gold/15 bg-ocean-panel/50", className)}
    >
      {title || description ? (
        <div className="px-4 pt-4 sm:px-5 sm:pt-5">
          {title ? <h3 className="font-sans text-base font-semibold tracking-normal text-foreground">{title}</h3> : null}
          {description ? (
            <div className="mt-1 max-w-3xl text-sm text-pretty text-muted-foreground">{description}</div>
          ) : null}
        </div>
      ) : null}
      <div className={cn("min-w-0 flex-1 px-4 py-4 sm:px-5", bodyClassName)}>{children}</div>
      {source ? (
        <div className="border-t border-gold/10 px-4 py-2.5 text-xs text-muted-foreground sm:px-5">{source}</div>
      ) : null}
    </div>
  );
}

/** "Source: benchmark.json → runs[].reps[].overall", linking the hosted file. */
export function SourceNote({
  files,
  field,
  calc,
}: {
  files: { href: string; name: string }[];
  field?: string;
  calc?: string;
}) {
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
      <FileJson className="size-3.5 shrink-0 text-gold/70" aria-hidden />
      <span>Source:</span>
      {files.map((f, i) => (
        <span key={f.href}>
          <a href={f.href} className="font-mono text-foreground/80 underline decoration-gold/30 underline-offset-2 hover:text-gold hover:decoration-gold">
            {f.name}
          </a>
          {i < files.length - 1 ? "," : ""}
        </span>
      ))}
      {field ? <span className="font-mono text-foreground/60">→ {field}</span> : null}
      {calc ? (
        <span>
          · computed by <code className="font-mono text-foreground/80">{calc}</code>
        </span>
      ) : null}
    </p>
  );
}

/* ------------------------------------------------------------------ figures */

export type Tone = "positive" | "negative" | "neutral" | "gold";

const toneText: Record<Tone, string> = {
  positive: "text-positive",
  negative: "text-negative",
  neutral: "text-muted-foreground",
  gold: "text-gold",
};

/** One headline number. */
export function Stat({
  label,
  value,
  detail,
  tone = "gold",
  source,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: Tone;
  source?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col rounded-lg border border-gold/15 bg-ocean-panel/50 p-4">
      <span className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">{label}</span>
      <span className={cn("mt-2 font-display text-3xl leading-none tabular-nums", toneText[tone])}>{value}</span>
      {detail ? <span className="mt-2 text-sm text-pretty text-foreground/75">{detail}</span> : null}
      {source ? <span className="mt-auto pt-3 text-[11px] text-muted-foreground">{source}</span> : null}
    </div>
  );
}

const pillTone: Record<Tone, string> = {
  positive: "border-positive/40 text-positive",
  negative: "border-negative/40 text-negative",
  neutral: "border-foreground/20 text-muted-foreground",
  gold: "border-gold/40 text-gold",
};

export function Pill({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs leading-none font-medium whitespace-nowrap",
        pillTone[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** A screenshot from the owner's terminal, opening full size on click. */
export function Screenshot({
  src,
  alt,
  command,
  children,
}: {
  src: string;
  alt: string;
  command: string;
  children?: ReactNode;
}) {
  return (
    <figure className="min-w-0">
      <a
        href={src}
        target="_blank"
        rel="noopener"
        className="group block overflow-hidden rounded-lg border border-gold/15 bg-black transition-colors hover:border-gold/45"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- terminal captures of varying size; shown as recorded */}
        <img src={src} alt={alt} loading="lazy" className="block h-auto w-full" />
      </a>
      <figcaption className="mt-2 text-xs text-pretty text-muted-foreground">
        <span className="text-foreground/80">From the owner&apos;s terminal:</span>{" "}
        <code className="font-mono text-foreground/80">{command}</code>
        {children ? <span> {children}</span> : null}{" "}
        <a href={src} target="_blank" rel="noopener" className="inline-flex items-center gap-0.5 text-gold hover:underline">
          Full size
          <ArrowUpRight className="size-3" aria-hidden />
        </a>
      </figcaption>
    </figure>
  );
}

/** Monospace block for Lean, TOML, JSON and command output. */
export function CodeBlock({ children, className, label }: { children: string; className?: string; label?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      {label ? <p className="mb-1.5 text-xs text-muted-foreground">{label}</p> : null}
      <pre className="overflow-x-auto rounded-md border border-gold/15 bg-ocean-deep px-3 py-2.5 font-mono text-[13px] leading-relaxed text-foreground/90">
        <code>{children}</code>
      </pre>
    </div>
  );
}

/* ------------------------------------------------------------------ tables */

/** Horizontally scrollable table frame; the header row stays put. */
export function DataTable({
  caption,
  children,
  className,
  maxHeight,
}: {
  caption?: string;
  children: ReactNode;
  className?: string;
  maxHeight?: string;
}) {
  return (
    <div
      className={cn("overflow-auto rounded-md border border-gold/15", className)}
      style={maxHeight ? { maxHeight } : undefined}
      tabIndex={0}
      role="region"
      aria-label={caption ?? "Table"}
    >
      <table className="w-full border-collapse text-sm">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        {children}
      </table>
    </div>
  );
}

export function Th({ className, numeric, ...props }: ComponentProps<"th"> & { numeric?: boolean }) {
  return (
    <th
      scope="col"
      className={cn(
        "sticky top-0 z-[1] bg-ocean-panel px-3 py-2 text-left text-[11px] font-semibold tracking-[0.08em] whitespace-nowrap text-muted-foreground uppercase",
        numeric && "text-right",
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, numeric, mono, ...props }: ComponentProps<"td"> & { numeric?: boolean; mono?: boolean }) {
  return (
    <td
      className={cn(
        "border-t border-gold/10 px-3 py-2 align-top text-foreground/85",
        numeric && "text-right tabular-nums whitespace-nowrap",
        mono && "font-mono text-[13px]",
        className,
      )}
      {...props}
    />
  );
}

/** Term and explanation pairs, two columns on wide screens. */
export function Definitions({ items, className }: { items: { term: ReactNode; detail: ReactNode }[]; className?: string }) {
  return (
    <dl className={cn("grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[minmax(9rem,max-content)_1fr]", className)}>
      {items.map((item, i) => (
        <div key={i} className="contents">
          <dt className="font-semibold text-foreground">{item.term}</dt>
          <dd className="-mt-2 text-pretty text-foreground/75 sm:mt-0">{item.detail}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Text from an evidence file that marks code with `backticks`, rendered with
 *  the code in monospace. The text itself is shown unchanged. */
export function Ticked({ text }: { text: string }) {
  const parts = text.split(/`([^`]+)`/);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 ? (
          <code key={i} className="rounded bg-ocean-deep px-1 py-px font-mono text-[0.9em] text-gold-soft">
            {part}
          </code>
        ) : (
          part
        ),
      )}
    </>
  );
}
