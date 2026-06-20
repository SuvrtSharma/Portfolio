"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { cn } from "@/lib/utils";
import { MapControls } from "../components/map-controls";
import { useMapCamera } from "../use-map-camera";
import type { MapRendererProps } from "./types";

/** Base medallion radius in CSS pixels (scaled by zoom). */
const NODE_RADIUS = 24;

interface Size {
  w: number;
  h: number;
}

/** Maps a normalized 0–100 coordinate to a screen pixel, replicating the DOM
 *  renderer's camera (scale about centre, then translate) so both tiers agree. */
function makeProjection(
  size: Size,
  zoom: number,
  panX: number,
  panY: number,
  aspect: number,
) {
  const planeW = Math.min(size.w, size.h * aspect);
  const planeH = planeW / aspect;
  const planeX = (size.w - planeW) / 2;
  const planeY = (size.h - planeH) / 2;
  const cx = size.w / 2;
  const cy = size.h / 2;
  return (nx: number, ny: number) => {
    const px = planeX + (nx / 100) * planeW;
    const py = planeY + (ny / 100) * planeH;
    return {
      x: cx + (px - cx) * zoom + panX,
      y: cy + (py - cy) * zoom + panY,
    };
  };
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/**
 * The Canvas 2D renderer — the middle tier between DOM and WebGL. Everything
 * visible is drawn on a single `<canvas>` (one paint surface, cheap effects);
 * mouse/touch use canvas hit-testing; and an overlay of transparent, focusable
 * buttons keeps the map keyboard- and screen-reader-accessible despite the
 * canvas being opaque to assistive tech.
 */
export function CanvasMapRenderer({
  world,
  selectedNodeId,
  hoveredNodeId,
  onSelectNode,
  onHoverNode,
}: MapRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState<Size | null>(null);
  const downRef = useRef<{ x: number; y: number } | null>(null);
  const movedRef = useRef(false);
  const bgRef = useRef<HTMLImageElement | null>(null);
  const [bgLoaded, setBgLoaded] = useState(false);

  const {
    camera,
    containerRef,
    isPanned,
    dragging,
    canZoomIn,
    canZoomOut,
    zoomIn,
    zoomOut,
    reset,
    dragHandlers,
  } = useMapCamera();

  // Track container size for canvas sizing + projection.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef]);

  // Load the illustrated backdrop once (if any), then redraw.
  useEffect(() => {
    const bg = world.background;
    if (!bg) return;
    const img = new window.Image();
    img.onload = () => {
      bgRef.current = img;
      setBgLoaded(true);
    };
    img.onerror = () => {
      bgRef.current = null;
      setBgLoaded(false);
    };
    img.src = bg.src;
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [world.background]);

  // Draw whenever the camera, selection, size, or backdrop changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size.w * dpr;
    canvas.height = size.h * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.w, size.h);

    // Ocean — a couple of cheap radial gradients.
    const ocean = ctx.createRadialGradient(
      size.w / 2,
      size.h * 0.1,
      0,
      size.w / 2,
      size.h * 0.1,
      Math.max(size.w, size.h),
    );
    ocean.addColorStop(0, "#0b2233");
    ocean.addColorStop(0.7, "#04111a");
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 0, size.w, size.h);

    const glow = ctx.createRadialGradient(
      size.w / 2,
      size.h * 0.42,
      0,
      size.w / 2,
      size.h * 0.42,
      size.w * 0.5,
    );
    glow.addColorStop(0, "rgba(212,175,55,0.06)");
    glow.addColorStop(1, "rgba(212,175,55,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, size.w, size.h);

    const project = makeProjection(
      size,
      camera.zoom,
      camera.x,
      camera.y,
      world.aspectRatio,
    );

    // Illustrated backdrop, drawn onto the same projected plane as the nodes.
    if (bgRef.current) {
      const tl = project(0, 0);
      const br = project(100, 100);
      ctx.drawImage(bgRef.current, tl.x, tl.y, br.x - tl.x, br.y - tl.y);
    }

    const positions = new Map(
      world.nodes.map((n) => [n.id, project(n.position.x, n.position.y)] as const),
    );

    // Routes.
    world.edges.forEach((edge) => {
      const a = positions.get(edge.from);
      const b = positions.get(edge.to);
      if (!a || !b) return;
      const hot =
        selectedNodeId !== null &&
        (edge.from === selectedNodeId || edge.to === selectedNodeId);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.setLineDash([3, 7]);
      ctx.lineCap = "round";
      ctx.lineWidth = hot ? 2 : 1.4;
      ctx.strokeStyle = hot
        ? "rgba(230,201,118,0.75)"
        : "rgba(212,175,55,0.32)";
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // Nodes.
    const r = NODE_RADIUS * camera.zoom;
    const showAllLabels = size.w >= 640;
    world.nodes.forEach((node) => {
      const p = positions.get(node.id);
      if (!p) return;
      const active = node.id === selectedNodeId;
      const hovered = node.id === hoveredNodeId;
      const raised = active || hovered;

      ctx.save();
      if (raised) {
        ctx.shadowColor = "rgba(212,175,55,0.7)";
        ctx.shadowBlur = 18;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(4,17,26,0.9)";
      ctx.fill();
      ctx.lineWidth = raised ? 2.5 : 1.5;
      ctx.strokeStyle = raised ? "#e6c976" : "rgba(212,175,55,0.55)";
      ctx.stroke();
      ctx.restore();

      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = raised ? "#e6c976" : "rgba(212,175,55,0.7)";
      ctx.fill();

      if (showAllLabels || raised) {
        const fontSize = Math.max(11, Math.min(15, 12 * camera.zoom));
        ctx.font = `600 ${fontSize}px Georgia, "Times New Roman", serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const padX = 8;
        const padY = 4;
        const textW = ctx.measureText(node.title).width;
        const boxW = textW + padX * 2;
        const boxH = fontSize + padY * 2;
        const boxX = p.x - boxW / 2;
        const boxY = p.y + r + 6;
        roundRectPath(ctx, boxX, boxY, boxW, boxH, 5);
        ctx.fillStyle = raised ? "#e8d8b5" : "rgba(4,17,26,0.8)";
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = raised ? "#c9b68a" : "rgba(212,175,55,0.25)";
        ctx.stroke();
        ctx.fillStyle = raised ? "#2a1c12" : "rgba(233,221,193,0.9)";
        ctx.fillText(node.title, p.x, boxY + padY);
      }
    });
  }, [size, camera, hoveredNodeId, selectedNodeId, world, bgLoaded]);

  function hitTest(clientX: number, clientY: number): string | null {
    const el = containerRef.current;
    if (!el || !size) return null;
    const rect = el.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;
    const project = makeProjection(
      size,
      camera.zoom,
      camera.x,
      camera.y,
      world.aspectRatio,
    );
    const hitR = NODE_RADIUS * camera.zoom + 6;
    let best: string | null = null;
    let bestDist = Infinity;
    for (const node of world.nodes) {
      const p = project(node.position.x, node.position.y);
      const d = Math.hypot(mx - p.x, my - p.y);
      if (d <= hitR && d < bestDist) {
        bestDist = d;
        best = node.id;
      }
    }
    return best;
  }

  const onPointerDown = (e: ReactPointerEvent) => {
    dragHandlers.onPointerDown(e);
    downRef.current = { x: e.clientX, y: e.clientY };
    movedRef.current = false;
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    dragHandlers.onPointerMove(e);
    if (downRef.current) {
      if (Math.hypot(e.clientX - downRef.current.x, e.clientY - downRef.current.y) > 6) {
        movedRef.current = true;
      }
      return;
    }
    onHoverNode(hitTest(e.clientX, e.clientY));
  };
  const onPointerUp = (e: ReactPointerEvent) => {
    dragHandlers.onPointerUp(e);
    if (downRef.current && !movedRef.current) {
      onSelectNode(hitTest(e.clientX, e.clientY));
    }
    downRef.current = null;
  };
  const onPointerCancel = (e: ReactPointerEvent) => {
    dragHandlers.onPointerCancel(e);
    downRef.current = null;
  };

  const project =
    size &&
    makeProjection(size, camera.zoom, camera.x, camera.y, world.aspectRatio);
  const buttonSize = NODE_RADIUS * 2 * camera.zoom;

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onPointerLeave={() => onHoverNode(null)}
      className={cn(
        "relative h-full w-full touch-none overflow-hidden select-none",
        isPanned ? (dragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default",
      )}
    >
      <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />

      {/* Accessibility layer: transparent, focusable hit-targets. `pointer-events-none`
          lets the canvas handle the mouse while these stay keyboard-focusable. */}
      {project
        ? world.nodes.map((node) => {
            const p = project(node.position.x, node.position.y);
            return (
              <button
                key={node.id}
                type="button"
                aria-pressed={node.id === selectedNodeId}
                aria-label={`${node.title}. ${node.summary}`}
                onFocus={() => onHoverNode(node.id)}
                onBlur={() => onHoverNode(null)}
                onClick={() => onSelectNode(node.id)}
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                style={{
                  left: `${p.x}px`,
                  top: `${p.y}px`,
                  width: `${buttonSize}px`,
                  height: `${buttonSize}px`,
                }}
              />
            );
          })
        : null}

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
