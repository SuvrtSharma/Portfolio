"use client";

import {
  useCallback,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

const MIN_ZOOM = 1;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.3;

export interface CameraState {
  zoom: number;
  /** Pan offset in pixels, relative to the centred map. */
  x: number;
  y: number;
}

interface DragOrigin {
  startX: number;
  startY: number;
  originX: number;
  originY: number;
}

/**
 * Pan/zoom for the DOM renderer. Pan is clamped so the map can't be dragged off
 * screen; zoom is clamped to a sane range. Camera behaviour lives here (not in
 * the engine) because it's renderer-specific — a WebGL camera would be different.
 */
export function useMapCamera() {
  const [camera, setCamera] = useState<CameraState>({ zoom: 1, x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const drag = useRef<DragOrigin | null>(null);

  const clamp = useCallback((next: CameraState): CameraState => {
    const el = containerRef.current;
    const w = el?.clientWidth ?? 0;
    const h = el?.clientHeight ?? 0;
    const maxX = ((next.zoom - 1) * w) / 2;
    const maxY = ((next.zoom - 1) * h) / 2;
    return {
      zoom: next.zoom,
      x: Math.min(maxX, Math.max(-maxX, next.x)),
      y: Math.min(maxY, Math.max(-maxY, next.y)),
    };
  }, []);

  const setZoom = useCallback(
    (z: number) => {
      const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(z.toFixed(3))));
      setCamera((c) => clamp({ ...c, zoom }));
    },
    [clamp],
  );

  const zoomIn = useCallback(
    () => setCamera((c) => clamp({ ...c, zoom: Math.min(MAX_ZOOM, c.zoom + ZOOM_STEP) })),
    [clamp],
  );
  const zoomOut = useCallback(
    () => setCamera((c) => clamp({ ...c, zoom: Math.max(MIN_ZOOM, c.zoom - ZOOM_STEP) })),
    [clamp],
  );
  const reset = useCallback(() => setCamera({ zoom: 1, x: 0, y: 0 }), []);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      if (e.button !== 0) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      drag.current = {
        startX: e.clientX,
        startY: e.clientY,
        originX: camera.x,
        originY: camera.y,
      };
      setDragging(true);
    },
    [camera.x, camera.y],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const nextX = d.originX + (e.clientX - d.startX);
      const nextY = d.originY + (e.clientY - d.startY);
      setCamera((c) => clamp({ ...c, x: nextX, y: nextY }));
    },
    [clamp],
  );

  const endDrag = useCallback((e: ReactPointerEvent) => {
    drag.current = null;
    setDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, []);

  const transform = `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`;
  const isPanned = camera.zoom > 1;

  return {
    camera,
    containerRef,
    transform,
    dragging,
    isPanned,
    canZoomIn: camera.zoom < MAX_ZOOM,
    canZoomOut: camera.zoom > MIN_ZOOM,
    zoomIn,
    zoomOut,
    reset,
    setZoom,
    dragHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
  };
}
