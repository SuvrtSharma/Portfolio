import { LocateFixed, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
  className?: string;
}

/** Presentational zoom/recenter cluster. Camera logic lives in the renderer
 *  that owns the camera, so these are pure callbacks. */
export function MapControls({
  onZoomIn,
  onZoomOut,
  onReset,
  canZoomIn,
  canZoomOut,
  className,
}: MapControlsProps) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border border-gold/20 bg-ocean-deep/80 backdrop-blur",
        className,
      )}
    >
      <ControlButton label="Zoom in" onClick={onZoomIn} disabled={!canZoomIn}>
        <Plus className="size-4" />
      </ControlButton>
      <ControlButton label="Zoom out" onClick={onZoomOut} disabled={!canZoomOut}>
        <Minus className="size-4" />
      </ControlButton>
      <ControlButton label="Recenter map" onClick={onReset}>
        <LocateFixed className="size-4" />
      </ControlButton>
    </div>
  );
}

function ControlButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex size-10 items-center justify-center border-b border-gold/10 text-foreground/80 transition-colors last:border-b-0 hover:bg-accent hover:text-gold focus-visible:bg-accent focus-visible:text-gold focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-35"
    >
      {children}
    </button>
  );
}
