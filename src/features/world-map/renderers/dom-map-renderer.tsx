"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { NodeMarkerProps } from "@/types";
import { Icon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { DefaultNodeMarker } from "../components/map-node";
import { MapAmbience } from "../components/map-ambience";
import { MapControls } from "../components/map-controls";
import { useMapCamera } from "../use-map-camera";
import type { MapRendererProps } from "./types";

/**
 * The DOM/SVG renderer — the default tier. Routes are SVG lines; islands are
 * real focusable buttons (so the map is keyboard- and screen-reader-navigable
 * and the labels are indexable HTML). Pan/zoom is a CSS transform on the stage.
 */
export function DomMapRenderer({
  world,
  selectedNodeId,
  hoveredNodeId,
  onSelectNode,
  onHoverNode,
  NodeMarker,
}: MapRendererProps) {
  const Marker: ComponentType<NodeMarkerProps> = NodeMarker ?? DefaultNodeMarker;
  const reducedMotion = useReducedMotion();
  const [bgError, setBgError] = useState(false);
  const background = !bgError ? world.background : undefined;
  const {
    containerRef,
    transform,
    dragging,
    isPanned,
    canZoomIn,
    canZoomOut,
    zoomIn,
    zoomOut,
    reset,
    dragHandlers,
  } = useMapCamera();

  const findNode = (id: string) => world.nodes.find((n) => n.id === id);

  // Keep node interactions from starting a map pan.
  const stopPan = (e: ReactPointerEvent) => e.stopPropagation();

  // Subtle mouse parallax on the decorative backdrop (desktop only). We write
  // the transform straight to the node via a ref + rAF so it never re-renders
  // React, and a CSS transition smooths it. Disabled under reduced motion.
  const backdropRef = useRef<HTMLDivElement>(null);
  const parallaxRaf = useRef(0);
  const onContainerPointerMove = (e: ReactPointerEvent) => {
    if (reducedMotion || e.pointerType !== "mouse") return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    cancelAnimationFrame(parallaxRaf.current);
    parallaxRaf.current = requestAnimationFrame(() => {
      if (backdropRef.current) {
        backdropRef.current.style.transform = `translate3d(${nx * 20}px, ${ny * 20}px, 0)`;
      }
    });
  };
  const resetParallax = () => {
    cancelAnimationFrame(parallaxRaf.current);
    if (backdropRef.current) backdropRef.current.style.transform = "";
  };
  useEffect(() => () => cancelAnimationFrame(parallaxRaf.current), []);

  return (
    <div
      ref={containerRef}
      onPointerMove={onContainerPointerMove}
      onPointerLeave={resetParallax}
      className="relative h-full w-full overflow-hidden"
    >
      {/* Static ocean backdrop (never transformed). Drifts gently with the
          cursor for depth; the transform is written imperatively above. */}
      <div
        ref={backdropRef}
        aria-hidden
        className="pointer-events-none absolute -inset-6 transition-transform duration-500 ease-out will-change-transform"
      >
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,#0b2233_0%,#04111a_72%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_42%,rgba(212,175,55,0.07),transparent_70%)]" />
        <Icon
          name="compass"
          className="absolute top-6 right-6 size-40 text-gold/[0.05] sm:size-56"
        />
        <Icon
          name="ship"
          className="absolute bottom-8 left-8 size-24 text-gold/[0.04] sm:size-32"
        />
      </div>

      {/* Pan/zoom stage. */}
      <div
        className={cn(
          "absolute inset-0 flex origin-center touch-none items-center justify-center select-none",
          isPanned
            ? dragging
              ? "cursor-grabbing"
              : "cursor-grab"
            : "cursor-default",
          !dragging && !reducedMotion && "transition-transform duration-300 ease-out",
        )}
        style={{ transform }}
        {...dragHandlers}
      >
        {/* Aspect-correct map plane, centred and letterboxed. */}
        <div
          className="relative w-full"
          style={{
            aspectRatio: world.aspectRatio,
            maxWidth: `calc((100svh - 4rem) * ${world.aspectRatio})`,
          }}
        >
          {background ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={background.src}
              alt=""
              aria-hidden
              onError={() => setBgError(true)}
              className="pointer-events-none absolute inset-0 h-full w-full rounded-xl object-cover"
            />
          ) : null}
          <svg
            className="absolute inset-0 h-full w-full"
            aria-hidden
            preserveAspectRatio="none"
          >
            {world.edges.map((edge) => {
              const a = findNode(edge.from);
              const b = findNode(edge.to);
              if (!a || !b) return null;
              const focus = selectedNodeId ?? hoveredNodeId;
              const hot =
                focus !== null && (edge.from === focus || edge.to === focus);
              return (
                <line
                  key={`${edge.from}-${edge.to}`}
                  className="animate-route-flow motion-reduce:animate-none"
                  x1={`${a.position.x}%`}
                  y1={`${a.position.y}%`}
                  x2={`${b.position.x}%`}
                  y2={`${b.position.y}%`}
                  stroke={hot ? "var(--brand-gold-soft)" : "var(--brand-gold)"}
                  strokeOpacity={hot ? 0.8 : 0.35}
                  strokeWidth={hot ? 2.25 : 1.5}
                  strokeDasharray="3 7"
                  strokeLinecap="round"
                  style={{ transition: "stroke-opacity 0.3s, stroke-width 0.3s" }}
                />
              );
            })}
          </svg>

          <MapAmbience />

          {world.nodes.map((node, index) => {
            const active = node.id === selectedNodeId;
            const hovered = node.id === hoveredNodeId;
            const raised = active || hovered;
            return (
              <div
                key={node.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${node.position.x}%`, top: `${node.position.y}%` }}
              >
                <motion.div
                  initial={reducedMotion ? false : { opacity: 0, scale: 0.85 }}
                  animate={reducedMotion ? undefined : { opacity: 1, scale: 1 }}
                  transition={{
                    delay: index * 0.05,
                    duration: 0.4,
                    ease: "easeOut",
                  }}
                >
                  {/* Idle float — gentle, staggered so the islands bob out of
                      sync. Pauses while raised so hover/active feel deliberate. */}
                  <motion.div
                    animate={
                      reducedMotion || raised ? { y: 0 } : { y: [0, -5, 0] }
                    }
                    transition={{
                      duration: 4.5 + index * 0.4,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 0.3,
                    }}
                  >
                    <button
                      type="button"
                      onPointerDown={stopPan}
                      onClick={() => onSelectNode(node.id)}
                      onMouseEnter={() => onHoverNode(node.id)}
                      onMouseLeave={() => onHoverNode(null)}
                      onFocus={() => onHoverNode(node.id)}
                      onBlur={() => onHoverNode(null)}
                      aria-pressed={active}
                      aria-label={`${node.title}. ${node.summary}`}
                      className="block rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
                    >
                      <Marker node={node} active={active} hovered={hovered} />
                    </button>
                  </motion.div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>

      <MapControls
        className="absolute right-4 bottom-4 z-10"
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={reset}
        canZoomIn={canZoomIn}
        canZoomOut={canZoomOut}
      />
    </div>
  );
}
