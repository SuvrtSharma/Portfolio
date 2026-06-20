"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { useVocabulary } from "@/themes";

const INTRO_KEY = "archipelago-intro-seen";
/** How long the full sequence runs before the overlay clears itself. */
const DURATION_MS = 3000;

/**
 * The opening sequence: painted clouds scale toward the viewer and part to
 * reveal the map, as a deep-sea wash clears and the world's name surfaces.
 *
 * It plays at most once per session (sessionStorage), is skippable (click, any
 * key, or the Skip button), and is suppressed entirely under reduced motion.
 * It renders nothing on the server and on the first client paint, so it never
 * blocks the map's LCP — the real map is already mounted underneath it.
 */
export function MapIntro() {
  const reducedMotion = useReducedMotion();
  const vocab = useVocabulary();
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (reducedMotion) return;
    let seen = false;
    try {
      seen = sessionStorage.getItem(INTRO_KEY) === "1";
    } catch {
      // Private mode / storage disabled — just skip the intro.
      return;
    }
    if (seen) return;
    sessionStorage.setItem(INTRO_KEY, "1");
    setPlaying(true);
    const timer = setTimeout(() => setPlaying(false), DURATION_MS);
    return () => clearTimeout(timer);
  }, [reducedMotion]);

  useEffect(() => {
    if (!playing) return;
    const skip = () => setPlaying(false);
    window.addEventListener("keydown", skip);
    return () => window.removeEventListener("keydown", skip);
  }, [playing]);

  return (
    <AnimatePresence>
      {playing ? (
        <motion.div
          key="map-intro"
          className="fixed inset-0 z-[90] cursor-pointer overflow-hidden"
          onClick={() => setPlaying(false)}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Deep-sea wash that clears as the clouds part. */}
          <motion.div
            className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_45%,#0b2233_0%,#020a12_100%)]"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 2.6, ease: "easeIn" }}
          />

          <Cloud src="/world/clouds/cloud-far.webp" scaleTo={1.3} duration={2.6} />
          <Cloud
            src="/world/clouds/cloud-mid.webp"
            scaleTo={1.55}
            duration={2.5}
            delay={0.1}
            drift={-50}
          />
          <Cloud
            src="/world/clouds/cloud-near.webp"
            scaleTo={2}
            duration={2.4}
            delay={0.2}
            drift={60}
          />

          {/* The world's name surfaces, then lifts away. */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center px-6 text-center"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: [0, 1, 1, 0], y: [14, 0, 0, -12] }}
            transition={{
              duration: 2.8,
              ease: "easeInOut",
              times: [0, 0.22, 0.7, 1],
            }}
          >
            <p className="font-script text-4xl text-gold [text-shadow:0_2px_12px_rgba(0,0,0,0.7)] sm:text-6xl">
              {vocab.worldName}
            </p>
          </motion.div>

          <button
            type="button"
            onClick={() => setPlaying(false)}
            className="absolute right-4 bottom-4 rounded-md border border-gold/30 bg-ocean-deep/70 px-3 py-1.5 text-xs tracking-widest text-foreground/80 uppercase backdrop-blur transition-colors hover:text-gold"
          >
            Skip
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Cloud({
  src,
  scaleTo,
  duration,
  delay = 0,
  drift = 0,
}: {
  src: string;
  scaleTo: number;
  duration: number;
  delay?: number;
  drift?: number;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <motion.img
      src={src}
      alt=""
      aria-hidden
      draggable={false}
      className="absolute inset-0 h-full w-full object-cover select-none"
      initial={{ scale: 1, opacity: 1, x: 0 }}
      animate={{ scale: scaleTo, opacity: 0, x: drift }}
      transition={{ duration, delay, ease: "easeIn" }}
    />
  );
}
