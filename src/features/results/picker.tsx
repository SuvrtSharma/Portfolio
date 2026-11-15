"use client";

import { ChevronDown } from "lucide-react";
import { useId } from "react";

/** A labelled native select, styled to match the dashboard. Native, so it is
 *  keyboard- and screen-reader-friendly and uses the phone's own picker. */
export function Picker({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div className="inline-flex items-center gap-2 text-sm">
      <label htmlFor={id} className="text-muted-foreground">
        {label}
      </label>
      <span className="relative inline-flex">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 appearance-none rounded-md border border-gold/25 bg-ocean-panel/60 pr-8 pl-3 text-foreground transition-colors hover:border-gold/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-popover text-popover-foreground">
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-gold" />
      </span>
    </div>
  );
}
