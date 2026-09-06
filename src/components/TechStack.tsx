"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";
import SectionHeading from "@/components/SectionHeading";
import { useLanguage } from "@/components/providers";
import { techStack, techDescriptions, techLinks } from "@/lib/config";
import { techIcon } from "@/components/tech-icons";
import type { Localized } from "@/types";

const WORLD = 1200;
const CENTER = WORLD / 2;
const CENTER_POS: Vec = { x: CENTER, y: CENTER };
const CAT_RADIUS = 210;
const ITEM_RADIUS = 400;
const ITEM_SPACING = 132;
const CAT_ANGLES = [-90, 0, 90, 180];

const MIN_ZOOM = 0.28;
const MAX_ZOOM = 2.4;
const ZOOM_STEP = 1.1;
const TILT_MAX = 2.4;
const FIT_PAD = 100;

// Motion tuning — exponential damping (frame-rate independent). Higher
// lambda = snappier. Pan stays 1:1 (direct) so dragging never feels laggy.
const TILT_LAMBDA = 8; // per second
const ZOOM_LAMBDA = 9; // per second
const SNAP_EPS = { zoom: 0.0004, pan: 0.1, tilt: 0.002 };

type Vec = { x: number; y: number };

type ItemNode = { label: string; pos: Vec };

type CategoryNode = {
  title: Localized;
  pos: Vec;
  items: ItemNode[];
};

type Gesture = {
  type: "pan" | "pinch";
  startX: number;
  startY: number;
  panX: number;
  panY: number;
  startDist: number;
  startZoom: number;
  midX: number;
  midY: number;
};

type Tip = { label: string; x: number; y: number; above: boolean };

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function buildLayout(): CategoryNode[] {
  return techStack.categories.map((cat, i) => {
    const angle = CAT_ANGLES[i % CAT_ANGLES.length];
    const a = (angle * Math.PI) / 180;
    const ux = Math.cos(a);
    const uy = Math.sin(a);
    const vx = -uy;
    const vy = ux;

    const pos: Vec = {
      x: CENTER + ux * CAT_RADIUS,
      y: CENTER + uy * CAT_RADIUS,
    };

    const n = cat.items.length;
    const items: ItemNode[] = cat.items.map((label, j) => {
      const t = (j - (n - 1) / 2) * ITEM_SPACING;
      const r = ITEM_RADIUS + (j % 2 === 0 ? -14 : 16);
      return {
        label,
        pos: {
          x: CENTER + ux * r + vx * t,
          y: CENTER + uy * r + vy * t,
        },
      };
    });

    return { title: cat.title, pos, items };
  });
}

function getMapSize(layout: CategoryNode[]) {
  let minX = CENTER;
  let maxX = CENTER;
  let minY = CENTER;
  let maxY = CENTER;
  layout.forEach((c) => {
    minX = Math.min(minX, c.pos.x);
    maxX = Math.max(maxX, c.pos.x);
    minY = Math.min(minY, c.pos.y);
    maxY = Math.max(maxY, c.pos.y);
    c.items.forEach((it) => {
      minX = Math.min(minX, it.pos.x);
      maxX = Math.max(maxX, it.pos.x);
      minY = Math.min(minY, it.pos.y);
      maxY = Math.max(maxY, it.pos.y);
    });
  });
  return { w: maxX - minX, h: maxY - minY };
}

const LAYOUT = buildLayout();
const MAP_SIZE = getMapSize(LAYOUT);

function makePath(a: Vec, b: Vec, bow = 0.14) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const offset = len * bow;
  const cx = mx + nx * offset;
  const cy = my + ny * offset;
  return `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
}

function Node({
  x,
  y,
  depth,
  delay,
  entered,
  flat = false,
  floatDelay,
  floatDuration = 6,
  children,
}: {
  x: number;
  y: number;
  depth: number;
  delay: number;
  entered: boolean;
  /** Mobile: skip translateZ — no 3D sorting while scrolling */
  flat?: boolean;
  /** seconds; negative = start mid-phase. Omit to disable floating */
  floatDelay?: number;
  floatDuration?: number;
  children: ReactNode;
}) {
  // The float runs on a SEPARATE child element so the entrance transition
  // (outer) and the ambient bob (inner) never fight over one transform.
  // `entered` only gates the one-shot entrance; the float starts with a
  // negative delay and simply never stops — no restart, no re-layout.
  const floatAnim =
    floatDelay === undefined
      ? undefined
      : entered
        ? `mm-float ${floatDuration}s ease-in-out ${floatDelay}s infinite`
        : undefined;
  return (
    <div
      className="absolute left-0 top-0"
      style={{
        transform: `translate(${x}px, ${y}px) translate(-50%, -50%) ${
          flat ? "" : `translateZ(${depth}px) `
        }scale(${entered ? 1 : 0.4})`,
        opacity: entered ? 1 : 0,
        transition:
          "transform 0.9s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1)",
        transitionDelay: `${delay}ms`,
      }}
    >
      <div
        className={floatDelay === undefined ? undefined : "mm-float"}
        style={floatAnim ? { animation: floatAnim } : undefined}
      >
        {children}
      </div>
    </div>
  );
}

function TechStackMindMap() {
  const { t } = useLanguage();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [defaultZoom, setDefaultZoom] = useState(1);
  const [hovered, setHovered] = useState<number | null>(null);
  const [tip, setTip] = useState<Tip | null>(null);
  // Mobile/touch: flatten the 3D world. Tilt (the only depth consumer) is
  // mouse-only, so preserve-3d + perspective there is pure scroll cost.
  const [flat, setFlat] = useState(false);
  // Entrance plays exactly once, on mount — never on scroll re-entry.
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse), (max-width: 767px)");
    const update = () => setFlat(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const panRef = useRef<Vec>({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const tiltRef = useRef<Vec>({ x: 0, y: 0 });
  // Motion targets — the RAF loop eases current state toward these.
  const targetPanRef = useRef<Vec>({ x: 0, y: 0 });
  const targetZoomRef = useRef(1);
  // Pointer position in [-1, 1]; resolved against TILT_MAX each frame.
  const tiltTargetRef = useRef<Vec>({ x: 0, y: 0 });
  const worldRef = useRef<HTMLDivElement | null>(null);
  const bgRef = useRef<HTMLDivElement | null>(null);
  const worldRaf = useRef(0);
  const lastFrameTs = useRef(0);

  // One writer, one frame: pointer/wheel/reset handlers only update refs,
  // then this single loop paints. No setState per pointermove, no CSS
  // transition chasing JS writes — the classic jank sources, both removed.
  const paint = useCallback(() => {
    const w = worldRef.current;
    if (!w) return;
    const p = panRef.current;
    const z = zoomRef.current;
    const tl = tiltRef.current;
    w.style.transform = `translate(-50%, -50%) translate(${p.x}px, ${p.y}px) scale(${z}) rotateX(${tl.x}deg) rotateY(${tl.y}deg)`;
    const b = bgRef.current;
    if (b) {
      b.style.transform = `translate(${p.x * -0.15}px, ${p.y * -0.15}px) scale(${
        1 + (z - 1) * 0.1
      })`;
    }
  }, []);

  const frame = useCallback(
    (ts: number) => {
      const dt = lastFrameTs.current ? Math.min((ts - lastFrameTs.current) / 1000, 0.05) : 0.016;
      lastFrameTs.current = ts;

      // Exponential ease toward targets — same feel at 60/120/144 Hz.
      const ease = (lambda: number) => 1 - Math.exp(-lambda * dt);
      const zk = ease(ZOOM_LAMBDA);
      const pk = 1; // pan targets are written 1:1 by drag handlers
      const tk = ease(TILT_LAMBDA);

      zoomRef.current += (targetZoomRef.current - zoomRef.current) * zk;
      panRef.current = {
        x: panRef.current.x + (targetPanRef.current.x - panRef.current.x) * pk,
        y: panRef.current.y + (targetPanRef.current.y - panRef.current.y) * pk,
      };
      tiltRef.current = {
        x: tiltRef.current.x + (tiltTargetRef.current.x - tiltRef.current.x) * tk,
        y: tiltRef.current.y + (tiltTargetRef.current.y - tiltRef.current.y) * tk,
      };

      paint();

      // Settle check: stop the loop when everything reached its target so an
      // idle map costs zero frames.
      const zDelta = Math.abs(targetZoomRef.current - zoomRef.current);
      const xDelta = Math.abs(targetPanRef.current.x - panRef.current.x);
      const yDelta = Math.abs(targetPanRef.current.y - panRef.current.y);
      const txDelta = Math.abs(tiltTargetRef.current.x - tiltRef.current.x);
      const tyDelta = Math.abs(tiltTargetRef.current.y - tiltRef.current.y);
      if (
        zDelta < SNAP_EPS.zoom &&
        xDelta < SNAP_EPS.pan &&
        yDelta < SNAP_EPS.pan &&
        txDelta < SNAP_EPS.tilt &&
        tyDelta < SNAP_EPS.tilt
      ) {
        zoomRef.current = targetZoomRef.current;
        panRef.current = { ...targetPanRef.current };
        tiltRef.current = { ...tiltTargetRef.current };
        paint();
        worldRaf.current = 0;
        lastFrameTs.current = 0;
        return;
      }
      worldRaf.current = requestAnimationFrame(frame);
    },
    [paint],
  );

  const scheduleWorldTransform = useCallback(() => {
    if (worldRaf.current) return;
    lastFrameTs.current = 0;
    worldRaf.current = requestAnimationFrame(frame);
  }, [frame]);

  const pointersRef = useRef<Map<number, Vec>>(new Map());
  const gestureRef = useRef<Gesture | null>(null);
  const hoverTimerRef = useRef<number | null>(null);
  const resetTimerRef = useRef<number | null>(null);
  const hoveredRef = useRef<number | null>(null);

  useEffect(() => {
    // Entrance: flip once after first paint so the pop-in + line draw
    // transition actually plays. Replays only on remount, not on scroll.
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const fit = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      const z = clamp(
        Math.min(
          w / (MAP_SIZE.w + FIT_PAD * 2),
          h / (MAP_SIZE.h + FIT_PAD * 2),
        ),
        MIN_ZOOM,
        1.1,
      );
      zoomRef.current = z;
      targetZoomRef.current = z;
      panRef.current = { x: 0, y: 0 };
      targetPanRef.current = { x: 0, y: 0 };
      paint();
      setDefaultZoom(z);
    };
    fit();
  }, [paint]);

  // Smooth zoom: wheel nudges the TARGET; the RAF loop glides there.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const z = targetZoomRef.current;
      const factor = e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
      const nz = clamp(z * factor, MIN_ZOOM, MAX_ZOOM);
      if (nz === z) return;
      const p = targetPanRef.current;
      const wx = (px - cx - p.x) / z;
      const wy = (py - cy - p.y) / z;
      targetPanRef.current = { x: px - cx - wx * nz, y: py - cy - wy * nz };
      targetZoomRef.current = nz;
      scheduleWorldTransform();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [scheduleWorldTransform]);

  const activate = useCallback((i: number) => {
    if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = null;
    hoveredRef.current = i;
    setHovered(i);
  }, []);

  const deactivate = useCallback(() => {
    if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = window.setTimeout(() => {
      hoveredRef.current = null;
      setHovered(null);
      setTip(null);
    }, 90);
  }, []);

  const placeTip = useCallback((label: string, wx: number, wy: number) => {
    const c = containerRef.current;
    if (!c) return;
    const cr = c.getBoundingClientRect();
    const zoom = zoomRef.current;
    const pan = panRef.current;
    const sx = cr.width / 2 + (wx - CENTER) * zoom + pan.x;
    const sy = cr.height / 2 + (wy - CENTER) * zoom + pan.y;
    const x = Math.min(Math.max(sx, 128), cr.width - 128);
    const above = sy - 170 > 0;
    setTip({ label, x, y: above ? sy - 24 : sy + 24, above });
  }, []);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const target = e.target as HTMLElement | null;
      if (target && target.closest("button, a, input, [role='button']")) return;

      e.currentTarget.setPointerCapture(e.pointerId);
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      const count = pointersRef.current.size;
      if (count === 1) {
        gestureRef.current = {
          type: "pan",
          startX: e.clientX,
          startY: e.clientY,
          panX: panRef.current.x,
          panY: panRef.current.y,
          startDist: 0,
          startZoom: zoomRef.current,
          midX: 0,
          midY: 0,
        };
      } else if (count === 2) {
        const pts = [...pointersRef.current.values()];
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const midX = (pts[0].x + pts[1].x) / 2;
        const midY = (pts[0].y + pts[1].y) / 2;
        gestureRef.current = {
          type: "pinch",
          startX: midX,
          startY: midY,
          panX: panRef.current.x,
          panY: panRef.current.y,
          startDist: dist,
          startZoom: zoomRef.current,
          midX,
          midY,
        };
      }
    },
    [],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      // Hover is handled by the individual skill links now. The map-level
      // pointer path only owns active drag/tilt work.
      if (
        e.pointerType === "mouse" &&
        !gestureRef.current &&
        containerRef.current
      ) {
        const rect = containerRef.current.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width - 0.5;
        const ny = (e.clientY - rect.top) / rect.height - 0.5;
        tiltTargetRef.current = { x: -ny * TILT_MAX, y: nx * TILT_MAX };
        scheduleWorldTransform();
      }

      if (!pointersRef.current.has(e.pointerId)) return;
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      const g = gestureRef.current;
      if (!g) return;

      if (g.type === "pan") {
        // Drag is 1:1: write current AND target so the loop paints the exact
        // finger/cursor position with zero lag.
        const p = { x: g.panX + (e.clientX - g.startX), y: g.panY + (e.clientY - g.startY) };
        panRef.current = p;
        targetPanRef.current = p;
        scheduleWorldTransform();
      } else {
        const pts = [...pointersRef.current.values()];
        if (pts.length === 2) {
          const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
          const midX = (pts[0].x + pts[1].x) / 2;
          const midY = (pts[0].y + pts[1].y) / 2;
          const nz = clamp(
            g.startZoom * (dist / Math.max(g.startDist, 1)),
            MIN_ZOOM,
            MAX_ZOOM,
          );
          const p = { x: g.panX + (midX - g.midX), y: g.panY + (midY - g.midY) };
          zoomRef.current = nz;
          targetZoomRef.current = nz;
          panRef.current = p;
          targetPanRef.current = p;
          scheduleWorldTransform();
        }
      }
    },
    [scheduleWorldTransform],
  );

  const releasePointer = useCallback((id: number) => {
    pointersRef.current.delete(id);
    const size = pointersRef.current.size;
    if (size === 0) {
      gestureRef.current = null;
    } else if (size === 1) {
      const p = [...pointersRef.current.values()][0];
      gestureRef.current = {
        type: "pan",
        startX: p.x,
        startY: p.y,
        panX: panRef.current.x,
        panY: panRef.current.y,
        startDist: 0,
        startZoom: zoomRef.current,
        midX: 0,
        midY: 0,
      };
    }
  }, []);

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => releasePointer(e.pointerId),
    [releasePointer],
  );

  const onPointerCancel = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => releasePointer(e.pointerId),
    [releasePointer],
  );

  const onPointerLeave = useCallback(() => {
    // Ease the tilt back to level instead of snapping — the damped loop
    // makes the release feel weighted.
    tiltTargetRef.current = { x: 0, y: 0 };
    scheduleWorldTransform();
    if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = null;
    hoveredRef.current = null;
    setHovered(null);
    setTip(null);
  }, [scheduleWorldTransform]);

  const reset = useCallback(() => {
    targetPanRef.current = { x: 0, y: 0 };
    targetZoomRef.current = defaultZoom;
    tiltTargetRef.current = { x: 0, y: 0 };
    scheduleWorldTransform();
  }, [defaultZoom, scheduleWorldTransform]);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
      if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
      if (worldRaf.current) cancelAnimationFrame(worldRaf.current);
    };
  }, []);

  const headingWords = t(techStack.heading).split(" ");

  return (
    <section className="px-6 py-24 md:px-10 md:py-32">
      <style>{`@keyframes mm-rotate { to { transform: rotate(360deg); } }
@keyframes tip-fade { from { opacity: 0; } }
@keyframes mm-float {
  0% { transform: translateY(0); }
  38% { transform: translateY(-5px); }
  68% { transform: translateY(3px); }
  100% { transform: translateY(0); }
}
@keyframes mm-glow { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
.mm-ring { animation: mm-rotate var(--ring-dur, 60s) linear infinite; }
.mm-ring-rev { animation-direction: reverse; }
.mm-link {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  transition:
    stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1) var(--mm-d, 0ms),
    stroke 0.25s ease,
    opacity 0.25s ease;
  will-change: stroke-dashoffset;
}
.mm-in .mm-link { stroke-dashoffset: 0; }
.mm-link.mm-active { stroke-dashoffset: 0.24; }
@media (prefers-reduced-motion: reduce) {
  .mm-float, .mm-glow, .mm-ring { animation: none !important; }
  .mm-link { stroke-dasharray: none; stroke-dashoffset: 0; transition: none; }
  .mm-link.mm-active { stroke-dasharray: none; }
}`}</style>
      <div className="mx-auto max-w-7xl">
        <SectionHeading kicker={techStack.kicker} heading={techStack.heading} index="05" />

        <div
          ref={containerRef}
          role="region"
          aria-label="Interactive tech stack mind map"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onPointerLeave={onPointerLeave}
          className="relative h-[460px] w-full cursor-grab touch-none select-none overflow-hidden rounded-3xl border border-black/10 bg-white/50 dark:border-white/10 dark:bg-white/[0.02] sm:h-[520px] md:h-[660px]"
          style={{ perspective: flat ? undefined : "1400px" }}
        >
          <div
            ref={bgRef}
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              transform: "translate(0px, 0px) scale(1)",
              backgroundImage: [
                "radial-gradient(rgba(127,127,127,0.22) 1px, transparent 1px)",
                "radial-gradient(circle at 50% 50%, rgba(235,89,57,0.12), transparent 55%)",
              ].join(", "),
              backgroundSize: "26px 26px, 100% 100%",
            }}
          />

          <div
            ref={worldRef}
            className="absolute left-1/2 top-1/2"
            style={{
              width: WORLD,
              height: WORLD,
              transform: "translate(-50%, -50%)",
              transformStyle: flat ? undefined : "preserve-3d",
              willChange: "transform",
            }}
          >
            <div
              aria-hidden
              className="mm-glow absolute rounded-full"
              style={{
                left: CENTER - 180,
                top: CENTER - 180,
                width: 360,
                height: 360,
                background:
                  "radial-gradient(circle, rgba(235,89,57,0.22), transparent 70%)",
                animation: "mm-glow 9s ease-in-out infinite",
              }}
            />

            <svg
              ref={svgRef}
              className={`absolute inset-0 h-full w-full overflow-visible ${entered ? "mm-in" : ""}`}
              viewBox={`0 0 ${WORLD} ${WORLD}`}
              fill="none"
              aria-hidden
            >
              {LAYOUT.map((cat, i) => {
                const active = hovered === i;
                const dimmed = hovered !== null && !active;
                return (
                  <g
                    key={i}
                    opacity={dimmed ? 0.35 : 1}
                    className="transition-opacity duration-300"
                  >
                    <path
                      d={makePath(CENTER_POS, cat.pos, 0.16)}
                      pathLength={1}
                      strokeLinecap="round"
                      className={`mm-link ${
                        active ? "mm-active stroke-accent" : "stroke-black/[0.18] dark:stroke-white/[0.18]"
                      }`}
                      style={{ strokeWidth: active ? 2 : 1.4, "--mm-d": `${i * 120}ms` } as CSSProperties}
                    />
                    {cat.items.map((it, j) => (
                      <path
                        key={j}
                        d={makePath(cat.pos, it.pos, 0.12)}
                        pathLength={1}
                        strokeLinecap="round"
                        className={`mm-link ${
                          active ? "mm-active stroke-accent/80" : "stroke-black/[0.12] dark:stroke-white/[0.12]"
                        }`}
                        style={{
                          strokeWidth: active ? 1.5 : 1.1,
                          "--mm-d": `${180 + i * 120 + j * 45}ms`,
                        } as CSSProperties}
                      />
                    ))}
                  </g>
                );
              })}
            </svg>

            <Node x={CENTER} y={CENTER} depth={40} delay={0} entered={entered} flat={flat}>
              <div className="relative flex h-44 w-44 items-center justify-center rounded-full border-2 border-accent/60 bg-panel text-center shadow-[0_30px_80px_-20px_rgba(235,89,57,0.55)] transition-[border-color,box-shadow] duration-500 hover:border-accent hover:shadow-[0_36px_90px_-20px_rgba(235,89,57,0.75)] md:h-48 md:w-48">
                <span
                  aria-hidden
                  className="mm-ring pointer-events-none absolute -inset-3 rounded-full border border-dashed border-accent/30"
                  style={{ "--ring-dur": "50s" } as CSSProperties}
                />
                <span
                  aria-hidden
                  className="mm-ring mm-ring-rev pointer-events-none absolute -inset-7 rounded-full border border-dashed border-accent/15"
                  style={{ "--ring-dur": "90s" } as CSSProperties}
                />
                <span className="relative flex flex-col items-center">
                  {headingWords.map((word) => (
                    <span
                      key={word}
                      className="text-display block text-2xl uppercase leading-[0.95] text-white md:text-3xl"
                    >
                      {word}
                    </span>
                  ))}
                  <span className="mt-2 text-[10px] uppercase tracking-[0.3em] text-accent">
                    ✦
                  </span>
                </span>
              </div>
            </Node>

            {LAYOUT.map((cat, i) => (
              <div key={i}>
                <Node
                  x={cat.pos.x}
                  y={cat.pos.y}
                  depth={18}
                  delay={140 + i * 120}
                  entered={entered}
                  flat={flat}
                  floatDelay={-i * 1.9}
                  floatDuration={9}
                >
                  <div
                    onMouseEnter={() => activate(i)}
                    onMouseLeave={deactivate}
                    className="flex items-center gap-2.5 whitespace-nowrap rounded-full border border-black/10 bg-panel py-3 pl-4 pr-5 shadow-[0_14px_40px_-14px_rgba(0,0,0,0.55)] transition-[border-color,box-shadow] duration-300 hover:border-accent/60 hover:shadow-[0_18px_50px_-14px_rgba(235,89,57,0.5)] dark:border-white/10 dark:shadow-[0_14px_40px_-14px_rgba(0,0,0,0.8)]"
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_12px_rgba(235,89,57,0.8)]" />
                    <span className="text-sm font-semibold text-zinc-800 dark:text-gray-100">
                      {t(cat.title)}
                    </span>
                  </div>
                </Node>

                {cat.items.map((it, j) => {
                  const link = techLinks[it.label];
                  const tipEnabled = !!techDescriptions[it.label] && !!link;
                  return (
                  <Node
                    key={it.label}
                    x={it.pos.x}
                    y={it.pos.y}
                    depth={(j % 2) * 8}
                    delay={220 + i * 120 + j * 45}
                    entered={entered}
                    flat={flat}
                    floatDelay={-(i * 1.3 + j * 0.71)}
                    floatDuration={8 + ((i * 7 + j * 13) % 6) * 0.9}
                  >
                    <a
                      href={link ?? undefined}
                      target={link ? "_blank" : undefined}
                      rel={link ? "noreferrer" : undefined}
                      role={link ? undefined : "button"}
                      tabIndex={link ? undefined : -1}
                      draggable={false}
                      onMouseEnter={() => {
                        activate(i);
                        if (tipEnabled) placeTip(it.label, it.pos.x, it.pos.y);
                      }}
                      onMouseLeave={deactivate}
                      onFocus={() => {
                        activate(i);
                        if (tipEnabled) placeTip(it.label, it.pos.x, it.pos.y);
                      }}
                      onBlur={deactivate}
                      onClick={(e) => {
                        if (!link) e.preventDefault();
                      }}
                      className="group relative flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-full border border-black/10 bg-panel px-4 py-2 text-sm font-medium text-zinc-700 no-underline shadow-[0_8px_24px_-10px_rgba(0,0,0,0.5)] transition-[border-color,color,box-shadow] duration-300 hover:border-accent/70 hover:text-accent hover:shadow-[0_16px_40px_-12px_rgba(235,89,57,0.55)] dark:border-white/10 dark:text-gray-300"
                    >
                      <span className="text-zinc-500 transition-colors group-hover:text-accent dark:text-gray-500">
                        {techIcon(it.label, "h-4 w-4")}
                      </span>
                      {it.label}
                      <span aria-hidden className="absolute -inset-1.5 rounded-full" />
                    </a>
                  </Node>
                );
                })}
              </div>
            ))}
          </div>

          {tip && techDescriptions[tip.label] && (
            <div
              role="tooltip"
              className="pointer-events-none absolute z-30 w-60 whitespace-normal rounded-xl border border-black/10 bg-panel px-4 py-3 text-left shadow-[0_20px_50px_-16px_rgba(0,0,0,0.6)] dark:border-white/10"
              style={{
                left: tip.x,
                top: tip.y,
                transform: `translate(-50%, ${tip.above ? "-100%" : "0"})`,
                animation: "tip-fade 0.18s ease-out",
              }}
            >
              <p className="text-[13px] font-semibold text-zinc-800 dark:text-gray-100">
                {tip.label}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-gray-400">
                {t(techDescriptions[tip.label])}
              </p>
              <p className="mt-2 text-[10px] uppercase tracking-widest text-accent">
                ↗ {t({ en: "Official site", id: "Situs resmi" })}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={reset}
            className="absolute right-4 top-4 z-20 flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-medium text-zinc-700 transition-colors hover:border-accent/60 hover:text-accent dark:border-white/10 dark:bg-[#181a22] dark:text-gray-200"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            {t({ en: "Reset", id: "Reset" })}
          </button>

          <div className="pointer-events-none absolute bottom-4 left-4 z-20 text-[11px] uppercase tracking-[0.18em] text-zinc-500 dark:text-gray-500">
            {t({ en: "Drag to pan · Scroll to zoom", id: "Seret untuk geser · Scroll untuk zoom" })}
          </div>
        </div>
      </div>
    </section>
  );
}

function TechStackMobile() {
  const { t } = useLanguage();

  return (
    <section className="px-6 py-20 md:hidden">
      <div className="mx-auto max-w-xl">
        <SectionHeading kicker={techStack.kicker} heading={techStack.heading} index="05" />

        <div className="mt-10 grid gap-3">
          {techStack.categories.map((category, index) => (
            <article
              key={category.title.en}
              className="rounded-2xl border border-black/10 bg-panel p-4 dark:border-white/10"
            >
              <div className="flex items-center gap-3">
                <span className="font-display text-sm text-accent">
                  0{index + 1}
                </span>
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-800 dark:text-gray-100">
                  {t(category.title)}
                </h3>
              </div>

              <ul className="mt-4 grid grid-cols-2 gap-2" aria-label={t(category.title)}>
                {category.items.map((label) => {
                  const link = techLinks[label];
                  const item = (
                    <span className="flex min-h-11 items-center gap-2 rounded-xl border border-black/10 bg-black/[0.03] px-3 py-2 text-xs font-medium text-zinc-700 transition-colors dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-300">
                      <span className="shrink-0 text-zinc-500 dark:text-gray-500">
                        {techIcon(label, "h-4 w-4")}
                      </span>
                      <span className="truncate">{label}</span>
                    </span>
                  );

                  return link ? (
                    <li key={label}>
                      <a
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${label} — official site`}
                        className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        {item}
                      </a>
                    </li>
                  ) : (
                    <li key={label}>{item}</li>
                  );
                })}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function TechStack() {
  // Start with the light renderer so mobile never mounts the expensive map
  // during hydration. Desktop swaps to the mind map after media is known.
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const media = window.matchMedia("(pointer: coarse), (max-width: 767px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isMobile ? <TechStackMobile /> : <TechStackMindMap />;
}
