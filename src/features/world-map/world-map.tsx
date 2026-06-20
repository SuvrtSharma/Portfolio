"use client";

import { useState } from "react";
import { useTheme, useVocabulary } from "@/themes";
import { cn } from "@/lib/utils";
import type { World } from "@/types";
import { MapDetailPanel } from "./components/map-detail-panel";
import { MapIntro } from "./components/map-intro";
import {
  DEFAULT_MAP_RENDERER,
  getMapRenderer,
  listMapRenderers,
} from "./renderers/registry";
import type { MapRendererId } from "./renderers/types";

/**
 * The world-map engine. It owns interaction state (selection, hover) and the
 * choice of renderer; it delegates *drawing* to the active renderer and *detail*
 * to the panel. It knows nothing about pirates — labels come from the theme's
 * vocabulary, and the marker shape can come from a theme slot.
 */
export function WorldMap({ world }: { world: World }) {
  const vocab = useVocabulary();
  const { slots } = useTheme();
  const [rendererId, setRendererId] = useState<MapRendererId>(DEFAULT_MAP_RENDERER);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const renderer = getMapRenderer(rendererId);
  const Renderer = renderer.Component!;
  const selectedNode =
    world.nodes.find((node) => node.id === selectedNodeId) ?? null;

  const isFocused = selectedNodeId !== null;

  return (
    <div className="relative h-[calc(100svh-4rem)] w-full overflow-hidden">
      {/* Map + chrome, dimmed and pushed back while an island card is open so
          the takeover reads as the world receding behind it. */}
      <div
        className={cn(
          "absolute inset-0 transition-[filter,transform] duration-500 ease-out motion-reduce:transition-none",
          isFocused && "scale-[1.03] [filter:brightness(0.5)_saturate(0.7)_blur(3px)]",
        )}
      >
        <div className="absolute inset-0">
          <Renderer
            world={world}
            selectedNodeId={selectedNodeId}
            hoveredNodeId={hoveredNodeId}
            onSelectNode={setSelectedNodeId}
            onHoverNode={setHoveredNodeId}
            NodeMarker={slots.NodeMarker}
          />
        </div>

        {/* Chrome overlay. The container ignores pointer events so map drags pass
            through; interactive children re-enable them. */}
        <div className="pointer-events-none absolute inset-0 z-10">
          <div className="absolute inset-x-0 top-4 flex justify-center px-4">
            <p className="rounded-md border border-parchment-dark/60 bg-parchment px-4 py-1.5 text-center font-display text-sm tracking-wide text-ink shadow-lg">
              {vocab.mapPrompt}
            </p>
          </div>

          <div className="absolute bottom-4 left-4">
            <RendererSwitcher active={rendererId} onSelect={setRendererId} />
          </div>
        </div>
      </div>

      <MapDetailPanel
        node={selectedNode}
        onClose={() => setSelectedNodeId(null)}
      />

      <MapIntro />
    </div>
  );
}

function RendererSwitcher({
  active,
  onSelect,
}: {
  active: MapRendererId;
  onSelect: (id: MapRendererId) => void;
}) {
  return (
    <div className="pointer-events-auto flex items-center gap-1 rounded-lg border border-gold/20 bg-ocean-deep/80 p-1 backdrop-blur">
      <span className="hidden px-2 text-[10px] font-semibold tracking-widest text-foreground/45 uppercase sm:inline">
        Renderer
      </span>
      {listMapRenderers().map((r) => {
        const isActive = r.id === active;
        const ready = r.status === "ready";
        return (
          <button
            key={r.id}
            type="button"
            disabled={!ready}
            onClick={() => ready && onSelect(r.id)}
            aria-pressed={isActive}
            title={
              ready
                ? r.description
                : `${r.label} — planned. ${r.description}`
            }
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              isActive
                ? "bg-gold text-ocean-deep"
                : ready
                  ? "text-foreground/80 hover:bg-accent hover:text-gold"
                  : "cursor-not-allowed text-foreground/35",
            )}
          >
            <span className="sm:hidden">{r.shortLabel}</span>
            <span className="hidden sm:inline">{r.label}</span>
            {!ready ? (
              <span className="ml-1 hidden text-[9px] uppercase opacity-70 sm:inline">
                soon
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
