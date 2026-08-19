"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import SectionHeading from "@/components/SectionHeading";
import { useLanguage } from "@/components/providers";
import { techStack } from "@/lib/config";
import type { Localized } from "@/types";

/* ---------------------------------------------------------------------------
 * Layout geometry (a radial mind map laid out on a fixed "world" canvas).
 * All coordinates are absolute pixels inside the world, centered on the
 * central node. Branches are spread around the four cardinal directions.
 * ------------------------------------------------------------------------- */

const WORLD = 1200;
const CENTER = WORLD / 2;
const CENTER_POS: Vec = { x: CENTER, y: CENTER };
const CAT_RADIUS = 210; // distance from center to category nodes
const ITEM_RADIUS = 400; // distance from center to item chips
const ITEM_SPACING = 132; // spacing between chips along a branch
const CAT_ANGLES = [-90, 0, 90, 180]; // top, right, bottom, left (degrees)

const MIN_ZOOM = 0.28;
const MAX_ZOOM = 2.4;
const ZOOM_STEP = 1.1;
const TILT_MAX = 3; // max parallax tilt in degrees
const FIT_PAD = 100; // padding around the map when auto-fitting

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

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function buildLayout(): CategoryNode[] {
  return techStack.categories.map((cat, i) => {
    const angle = CAT_ANGLES[i % CAT_ANGLES.length];
    const a = (angle * Math.PI) / 180;
    // outward (radial) unit vector and its perpendicular
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

// Deterministic layout + bounds computed once at module load.
const LAYOUT = buildLayout();
const MAP_SIZE = getMapSize(LAYOUT);

/** Quadratic bezier between two world points with a gentle outward bow. */
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

/* ---------------------------------------------------------------------------
 * Positioning wrapper: places a node at world coordinates, applies 3D depth
 * (translateZ) and the staggered entrance animation (scale + fade).
 * ------------------------------------------------------------------------- */
function Node({
  x,
  y,
  depth,
  delay,
  entered,
  children,
}: {
  x: number;
  y: number;
  depth: number;
  delay: number;
  entered: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className="absolute left-0 top-0"
      style={{
        transform: `translate(${x}px, ${y}px) translate(-50%, -50%) translateZ(${depth}px) scale(${
          entered ? 1 : 0.4
        })`,
        opacity: entered ? 1 : 0,
        transition:
          "transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
        transitionDelay: `${delay}ms`,
        willChange: "transform, opacity",
      }}
    >
      {children}
    </div>
  );
}

export default function TechStack() {
  const { t } = useLanguage();

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Camera state (pan in px, zoom as scale, tilt for parallax).
  const [panState, setPanState] = useState<Vec>({ x: 0, y: 0 });
  const [zoomState, setZoomState] = useState(1);
  const [tilt, setTilt] = useState<Vec>({ x: 0, y: 0 });
  const [defaultZoom, setDefaultZoom] = useState(1);
  const [hovered, setHovered] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [entered, setEntered] = useState(false);

  // Refs mirror camera state so gesture/zoom math never reads stale values.
  const panRef = useRef<Vec>({ x: 0, y: 0 });
  const zoomRef = useRef(1);

  const pointersRef = useRef<Map<number, Vec>>(new Map());
  const gestureRef = useRef<Gesture | null>(null);
  const hoverTimerRef = useRef<number | null>(null);
  const resetTimerRef = useRef<number | null>(null);

  const setPan = useCallback((p: Vec) => {
    panRef.current = p;
    setPanState(p);
  }, []);

  const setZoom = useCallback((z: number) => {
    zoomRef.current = z;
    setZoomState(z);
  }, []);

  // Initial fit + entrance animation (client only).
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
      setZoom(z);
      setPan({ x: 0, y: 0 });
      setDefaultZoom(z);
    };
    fit();
    setEntered(true);
  }, [setPan, setZoom]);

  // Native non-passive wheel listener for zoom-to-cursor.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) return; // allow browser pinch / ctrl-zoom
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const z = zoomRef.current;
      const factor = e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
      const nz = clamp(z * factor, MIN_ZOOM, MAX_ZOOM);
      if (nz === z) return;
      const p = panRef.current;
      const wx = (px - cx - p.x) / z;
      const wy = (py - cy - p.y) / z;
      setPan({ x: px - cx - wx * nz, y: py - cy - wy * nz });
      setZoom(nz);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [setPan, setZoom]);

  // Pointer gesture handlers (mouse drag + touch pan/pinch).
  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      // Don't hijack the press when it starts on an interactive control
      // (e.g. the Reset button). setPointerCapture would otherwise swallow
      // the resulting click event and the button would do nothing.
      const target = e.target as HTMLElement | null;
      if (target && target.closest("button, a, input, [role='button']")) return;

      e.currentTarget.setPointerCapture(e.pointerId);
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      setResetting(false);

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
      setDragging(true);
    },
    [],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!pointersRef.current.has(e.pointerId)) return;
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      // Parallax tilt follows the mouse only (not touch).
      if (e.pointerType === "mouse" && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width - 0.5;
        const ny = (e.clientY - rect.top) / rect.height - 0.5;
        setTilt({ x: -ny * TILT_MAX, y: nx * TILT_MAX });
      }

      const g = gestureRef.current;
      if (!g) return;

      if (g.type === "pan") {
        setPan({
          x: g.panX + (e.clientX - g.startX),
          y: g.panY + (e.clientY - g.startY),
        });
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
          setZoom(nz);
          setPan({ x: g.panX + (midX - g.midX), y: g.panY + (midY - g.midY) });
        }
      }
    },
    [setPan, setZoom],
  );

  const releasePointer = useCallback((id: number) => {
    pointersRef.current.delete(id);
    const size = pointersRef.current.size;
    if (size === 0) {
      gestureRef.current = null;
      setDragging(false);
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
    setTilt({ x: 0, y: 0 });
  }, []);

  const reset = useCallback(() => {
    setResetting(true);
    setPan({ x: 0, y: 0 });
    setZoom(defaultZoom);
    setTilt({ x: 0, y: 0 });
    if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
    resetTimerRef.current = window.setTimeout(() => setResetting(false), 500);
  }, [defaultZoom, setPan, setZoom]);

  // Branch highlight (with a short debounce so moving between sibling
  // chips in the same category doesn't flicker).
  const activate = useCallback((i: number) => {
    if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = null;
    setHovered(i);
  }, []);

  const deactivate = useCallback(() => {
    if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = window.setTimeout(() => setHovered(null), 90);
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
      if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
    };
  }, []);

  const worldTransition = resetting
    ? "transition-transform duration-500 ease-out"
    : dragging
      ? ""
      : "transition-transform duration-150 ease-out";

  const headingWords = t(techStack.heading).split(" ");

  return (
    <section className="px-6 py-24 md:px-10 md:py-32">
      <style>{`@keyframes mm-rotate { to { transform: rotate(360deg); } }`}</style>
      <div className="mx-auto max-w-7xl">
        <SectionHeading kicker={techStack.kicker} heading={techStack.heading} index="06" />

        <div
          ref={containerRef}
          role="region"
          aria-label="Interactive tech stack mind map"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onPointerLeave={onPointerLeave}
          className={`relative h-[460px] w-full cursor-grab touch-none select-none overflow-hidden rounded-3xl border border-black/10 bg-white/50 dark:border-white/10 dark:bg-white/[0.02] sm:h-[520px] md:h-[660px] ${
            dragging ? "cursor-grabbing" : ""
          }`}
          style={{ perspective: "1400px" }}
        >
          {/* Decorative background: dot grid + accent glow with parallax. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 transition-transform duration-150 ease-out"
            style={{
              transform: `translate(${panState.x * -0.15}px, ${panState.y * -0.15}px) scale(${
                1 + (zoomState - 1) * 0.1
              })`,
              backgroundImage: [
                "radial-gradient(rgba(127,127,127,0.22) 1px, transparent 1px)",
                "radial-gradient(circle at 50% 50%, rgba(235,89,57,0.12), transparent 55%)",
              ].join(", "),
              backgroundSize: "26px 26px, 100% 100%",
            }}
          />

          {/* World canvas */}
          <div
            className={`absolute left-1/2 top-1/2 ${worldTransition}`}
            style={{
              width: WORLD,
              height: WORLD,
              transform: `translate(-50%, -50%) translate(${panState.x}px, ${panState.y}px) scale(${zoomState}) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
              transformStyle: "preserve-3d",
              willChange: "transform",
            }}
          >
            {/* Soft glow behind the central node */}
            <div
              aria-hidden
              className="absolute rounded-full blur-2xl"
              style={{
                left: CENTER - 180,
                top: CENTER - 180,
                width: 360,
                height: 360,
                background:
                  "radial-gradient(circle, rgba(235,89,57,0.22), transparent 70%)",
              }}
            />

            {/* Connector lines */}
            <svg
              className="absolute inset-0 h-full w-full overflow-visible"
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
                      strokeWidth={2}
                      strokeLinecap="round"
                      className={active ? "stroke-accent" : "stroke-black/[0.18] dark:stroke-white/[0.18]"}
                    />
                    {cat.items.map((it, j) => (
                      <path
                        key={j}
                        d={makePath(cat.pos, it.pos, 0.12)}
                        strokeWidth={1.25}
                        strokeLinecap="round"
                        className={
                          active ? "stroke-accent/80" : "stroke-black/[0.12] dark:stroke-white/[0.12]"
                        }
                      />
                    ))}
                  </g>
                );
              })}
            </svg>

            {/* Central node */}
            <Node x={CENTER} y={CENTER} depth={40} delay={0} entered={entered}>
              <div className="relative flex h-44 w-44 items-center justify-center rounded-full border-2 border-accent/60 bg-panel text-center shadow-[0_30px_80px_-20px_rgba(235,89,57,0.55)] transition-all duration-300 hover:scale-105 hover:border-accent hover:shadow-[0_36px_90px_-20px_rgba(235,89,57,0.75)] md:h-48 md:w-48">
                <span
                  aria-hidden
                  className="pointer-events-none absolute -inset-3 rounded-full border border-dashed border-accent/30"
                  style={{ animation: "mm-rotate 18s linear infinite" }}
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

            {/* Category nodes + item chips */}
            {LAYOUT.map((cat, i) => (
              <div key={i}>
                <Node x={cat.pos.x} y={cat.pos.y} depth={18} delay={140 + i * 120} entered={entered}>
                  <div
                    onMouseEnter={() => activate(i)}
                    onMouseLeave={deactivate}
                    className="flex items-center gap-2.5 whitespace-nowrap rounded-full border border-black/10 bg-panel py-3 pl-4 pr-5 shadow-[0_14px_40px_-14px_rgba(0,0,0,0.55)] transition-all duration-300 hover:scale-105 hover:border-accent/60 hover:shadow-[0_18px_50px_-14px_rgba(235,89,57,0.5)] dark:border-white/10 dark:shadow-[0_14px_40px_-14px_rgba(0,0,0,0.8)]"
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_12px_rgba(235,89,57,0.8)]" />
                    <span className="text-sm font-semibold text-zinc-800 dark:text-gray-100">
                      {t(cat.title)}
                    </span>
                  </div>
                </Node>

                {cat.items.map((it, j) => (
                  <Node
                    key={it.label}
                    x={it.pos.x}
                    y={it.pos.y}
                    depth={(j % 2) * 8}
                    delay={220 + i * 120 + j * 45}
                    entered={entered}
                  >
                    <div
                      onMouseEnter={() => activate(i)}
                      onMouseLeave={deactivate}
                      className="whitespace-nowrap rounded-full border border-black/10 bg-panel px-4 py-2 text-sm font-medium text-zinc-700 shadow-[0_8px_24px_-10px_rgba(0,0,0,0.5)] transition-all duration-300 hover:scale-110 hover:border-accent/70 hover:text-accent hover:shadow-[0_16px_40px_-12px_rgba(235,89,57,0.55)] dark:border-white/10 dark:text-gray-300"
                    >
                      {it.label}
                    </div>
                  </Node>
                ))}
              </div>
            ))}
          </div>

          {/* Reset button */}
          <button
            type="button"
            onClick={reset}
            className="absolute right-4 top-4 z-20 flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-4 py-2 text-xs font-medium text-zinc-700 backdrop-blur transition-colors hover:border-accent/60 hover:text-accent dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
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

          {/* Hint */}
          <div className="pointer-events-none absolute bottom-4 left-4 z-20 text-[11px] uppercase tracking-[0.18em] text-zinc-500 dark:text-gray-500">
            {t({ en: "Drag to pan · Scroll to zoom", id: "Seret untuk geser · Scroll untuk zoom" })}
          </div>
        </div>
      </div>
    </section>
  );
}
