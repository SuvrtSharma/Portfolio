"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Ambient sprites that drift across the open water — painted ships, a rowboat,
 * and a gull. They live inside the map plane (so they pan/zoom with the world
 * and sit "on" the sea), are purely decorative (`pointer-events-none`), and hold
 * still under reduced motion. Positions are in the same normalized 0–100 plane
 * space as the islands, chosen to sail clear of land and the baked-in ships.
 */
interface Sprite {
  src: string;
  /** Base anchor, as a percentage of the map plane. */
  x: number;
  y: number;
  /** Width as a percentage of the plane (height follows the art's aspect). */
  size: number;
  /** Heading the bow/body points, in degrees. */
  rot: number;
  /** Looping drift in px — first and last frame are 0 so the loop is seamless. */
  dx: number[];
  dy: number[];
  /** Gentle sway added on top of the heading, in degrees. */
  sway: number[];
  duration: number;
  delay?: number;
  /** Hidden below the `sm` breakpoint to keep small screens uncluttered. */
  desktopOnly?: boolean;
}

const SPRITES: Sprite[] = [
  {
    src: "/world/sprites/ship-1.webp",
    x: 40,
    y: 38,
    size: 8,
    rot: 14,
    dx: [0, 34, 12, 0],
    dy: [0, -6, -11, 0],
    sway: [0, -3, 2, 0],
    duration: 46,
  },
  {
    src: "/world/sprites/ship-2.webp",
    x: 67,
    y: 43,
    size: 7,
    rot: -20,
    dx: [0, -28, -8, 0],
    dy: [0, -8, -4, 0],
    sway: [0, 3, -2, 0],
    duration: 55,
    delay: 3,
    desktopOnly: true,
  },
  {
    src: "/world/sprites/boat.webp",
    x: 37,
    y: 67,
    size: 4,
    rot: 10,
    dx: [0, 18, 6, 0],
    dy: [0, -5, -9, 0],
    sway: [0, -5, 3, 0],
    duration: 38,
    delay: 1.5,
  },
  {
    src: "/world/sprites/gull.webp",
    x: 60,
    y: 14,
    size: 3.5,
    rot: 0,
    dx: [0, 42, 0, -42, 0],
    dy: [0, -14, -22, -10, 0],
    sway: [0, 4, 0, -4, 0],
    duration: 34,
    desktopOnly: true,
  },
];

export function MapAmbience() {
  const reducedMotion = useReducedMotion();

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {SPRITES.map((s) => (
        <div
          key={s.src}
          className={cn(
            "absolute -translate-x-1/2 -translate-y-1/2",
            s.desktopOnly && "hidden sm:block",
          )}
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: `${s.size}%` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img
            src={s.src}
            alt=""
            loading="lazy"
            draggable={false}
            className="h-auto w-full select-none [filter:drop-shadow(0_3px_5px_rgba(0,0,0,0.35))]"
            initial={{ rotate: s.rot }}
            animate={
              reducedMotion
                ? { rotate: s.rot }
                : {
                    x: s.dx,
                    y: s.dy,
                    rotate: s.sway.map((d) => s.rot + d),
                  }
            }
            transition={
              reducedMotion
                ? undefined
                : {
                    duration: s.duration,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: s.delay ?? 0,
                  }
            }
          />
        </div>
      ))}
    </div>
  );
}
