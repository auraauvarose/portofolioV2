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
const TILT_MAX = 3;
const FIT_PAD = 100;
const HOVER_R = 88;

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
  floatDelay,
  floatDuration = 6,
  children,
}: {
  x: number;
  y: number;
  depth: number;
  delay: number;
  entered: boolean;
  /** seconds; negative = start mid-phase. Omit to disable floating */
  floatDelay?: number;
  floatDuration?: number;
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
      }}
    >
      <div
        className={floatDelay === undefined ? undefined : "mm-float"}
        style={
          floatDelay === undefined
            ? undefined
            : {
                animationDuration: `${floatDuration}s`,
                animationDelay: `${floatDelay}s`,
              }
        }
      >
        {children}
      </div>
    </div>
  );
}

export default function TechStack() {
  const { t } = useLanguage();

  const containerRef = useRef<HTMLDivElement | null>(null);

  const [panState, setPanState] = useState<Vec>({ x: 0, y: 0 });
  const [zoomState, setZoomState] = useState(1);
  const [tilt, setTilt] = useState<Vec>({ x: 0, y: 0 });
  const [defaultZoom, setDefaultZoom] = useState(1);
  const [hovered, setHovered] = useState<number | null>(null);
  const [tip, setTip] = useState<Tip | null>(null);
  const [dragging, setDragging] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [entered, setEntered] = useState(false);

  const panRef = useRef<Vec>({ x: 0, y: 0 });
  const zoomRef = useRef(1);

  const pointersRef = useRef<Map<number, Vec>>(new Map());
  const gestureRef = useRef<Gesture | null>(null);
  const hoverTimerRef = useRef<number | null>(null);
  const resetTimerRef = useRef<number | null>(null);
  const hoveredRef = useRef<number | null>(null);

  const setPan = useCallback((p: Vec) => {
    panRef.current = p;
    setPanState(p);
  }, []);

  const setZoom = useCallback((z: number) => {
    zoomRef.current = z;
    setZoomState(z);
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
      setZoom(z);
      setPan({ x: 0, y: 0 });
      setDefaultZoom(z);
    };
    fit();
  }, [setPan, setZoom]);

  // Pop-in + line draw replay every time the section enters the viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => setEntered(en.isIntersecting));
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

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

  const trackHover = useCallback((clientX: number, clientY: number) => {
    const c = containerRef.current;
    if (!c) return;
    const cr = c.getBoundingClientRect();
    const zoom = zoomRef.current;
    const pan = panRef.current;
    const wx = (clientX - cr.left - cr.width / 2 - pan.x) / zoom + CENTER;
    const wy = (clientY - cr.top - cr.height / 2 - pan.y) / zoom + CENTER;
    let best: { label: string; cat: number; d2: number; wx: number; wy: number } | null = null;
    for (let ci = 0; ci < LAYOUT.length; ci++) {
      const cat = LAYOUT[ci];
      for (let j = 0; j < cat.items.length; j++) {
        const it = cat.items[j];
        const dx = it.pos.x - wx;
        const dy = it.pos.y - wy;
        const d2 = dx * dx + dy * dy;
        if (d2 <= HOVER_R * HOVER_R && (!best || d2 < best.d2)) {
          best = { label: it.label, cat: ci, d2, wx: it.pos.x, wy: it.pos.y };
        }
      }
    }
    if (best) {
      if (hoverTimerRef.current) {
        window.clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
      hoveredRef.current = best.cat;
      setHovered(best.cat);
      if (techDescriptions[best.label]) placeTip(best.label, best.wx, best.wy);
    } else if (hoveredRef.current !== null) {
      deactivate();
    }
  }, [deactivate, placeTip]);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
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
      if (e.pointerType === "mouse" && !gestureRef.current) {
        trackHover(e.clientX, e.clientY);
      }

      if (!pointersRef.current.has(e.pointerId)) return;
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (
        e.pointerType === "mouse" &&
        containerRef.current &&
        hoveredRef.current === null
      ) {
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
    [setPan, setZoom, trackHover],
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
    if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = null;
    hoveredRef.current = null;
    setHovered(null);
    setTip(null);
  }, []);

  const reset = useCallback(() => {
    setResetting(true);
    setPan({ x: 0, y: 0 });
    setZoom(defaultZoom);
    setTilt({ x: 0, y: 0 });
    if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
    resetTimerRef.current = window.setTimeout(() => setResetting(false), 500);
  }, [defaultZoom, setPan, setZoom]);

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
      <style>{`@keyframes mm-rotate { to { transform: rotate(360deg); } }
@keyframes tip-fade { from { opacity: 0; } }
@keyframes mm-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
@keyframes mm-glow { 0%, 100% { opacity: 0.75; } 50% { opacity: 1; } }
.mm-link { stroke-dasharray: 1; stroke-dashoffset: 1; transition: stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1); }
.mm-links-in .mm-link { stroke-dashoffset: 0; }
@media (prefers-reduced-motion: reduce) {
  .mm-float, .mm-glow { animation: none !important; }
  .mm-link { stroke-dasharray: none; stroke-dashoffset: 0; transition: none; }
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
          className={`relative h-[460px] w-full cursor-grab touch-none select-none overflow-hidden rounded-3xl border border-black/10 bg-white/50 dark:border-white/10 dark:bg-white/[0.02] sm:h-[520px] md:h-[660px] ${
            dragging ? "cursor-grabbing" : ""
          }`}
          style={{ perspective: "1400px" }}
        >
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
            <div
              aria-hidden
              className="mm-glow absolute rounded-full blur-2xl"
              style={{
                left: CENTER - 180,
                top: CENTER - 180,
                width: 360,
                height: 360,
                background:
                  "radial-gradient(circle, rgba(235,89,57,0.22), transparent 70%)",
                animation: "mm-glow 5s ease-in-out infinite",
              }}
            />

            <svg
              className={`absolute inset-0 h-full w-full overflow-visible ${entered ? "mm-links-in" : ""}`}
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
                      strokeWidth={2}
                      strokeLinecap="round"
                      className={`mm-link ${
                        active ? "stroke-accent" : "stroke-black/[0.18] dark:stroke-white/[0.18]"
                      }`}
                      style={{ transitionDelay: `${i * 120}ms` }}
                    />
                    {cat.items.map((it, j) => (
                      <path
                        key={j}
                        d={makePath(cat.pos, it.pos, 0.12)}
                        pathLength={1}
                        strokeWidth={1.25}
                        strokeLinecap="round"
                        className={`mm-link ${
                          active ? "stroke-accent/80" : "stroke-black/[0.12] dark:stroke-white/[0.12]"
                        }`}
                        style={{ transitionDelay: `${180 + i * 120 + j * 45}ms` }}
                      />
                    ))}
                  </g>
                );
              })}
            </svg>

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

            {LAYOUT.map((cat, i) => (
              <div key={i}>
                <Node
                  x={cat.pos.x}
                  y={cat.pos.y}
                  depth={18}
                  delay={140 + i * 120}
                  entered={entered}
                  floatDelay={-i * 1.3}
                  floatDuration={7.5}
                >
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
                    floatDelay={-(i * 0.9 + j * 0.5)}
                    floatDuration={4.5 + ((i + j) % 4) * 0.7}
                  >
                    <a
                      href={link ?? undefined}
                      target={link ? "_blank" : undefined}
                      rel={link ? "noreferrer" : undefined}
                      role={link ? undefined : "button"}
                      tabIndex={link ? undefined : -1}
                      draggable={false}
                      onFocus={() => {
                        hoveredRef.current = i;
                        setHovered(i);
                        if (tipEnabled) placeTip(it.label, it.pos.x, it.pos.y);
                      }}
                      onBlur={deactivate}
                      onClick={(e) => {
                        if (!link) e.preventDefault();
                      }}
                      className="group relative flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-full border border-black/10 bg-panel px-4 py-2 text-sm font-medium text-zinc-700 no-underline shadow-[0_8px_24px_-10px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-accent/70 hover:text-accent hover:shadow-[0_16px_40px_-12px_rgba(235,89,57,0.55)] dark:border-white/10 dark:text-gray-300"
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
              className="pointer-events-none absolute z-30 w-60 whitespace-normal rounded-xl border border-black/10 bg-panel/95 px-4 py-3 text-left shadow-[0_20px_50px_-16px_rgba(0,0,0,0.6)] backdrop-blur dark:border-white/10"
              style={{
                left: tip.x,
                top: tip.y,
                transform: `translate(-50%, ${tip.above ? "-100%" : "0"})`,
                animation: "tip-fade 0.15s ease-out",
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

          <div className="pointer-events-none absolute bottom-4 left-4 z-20 text-[11px] uppercase tracking-[0.18em] text-zinc-500 dark:text-gray-500">
            {t({ en: "Drag to pan · Scroll to zoom", id: "Seret untuk geser · Scroll untuk zoom" })}
          </div>
        </div>
      </div>
    </section>
  );
}
