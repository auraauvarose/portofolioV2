"use client";

import { useEffect, useRef } from "react";
import type { ReactNode, PointerEvent, MouseEvent as ReactMouseEvent } from "react";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Interactive 3D tilt card.
 *
 * v2 — deep tilt with damped motion instead of the old jump:
 *  - rAF lerp loop: the rotation eases toward the cursor and springs back
 *    on leave, so the card never snaps (the old 200ms CSS transition made
 *    it feel stuck/asleep).
 *  - translateZ lift: the whole card floats toward the viewer on hover.
 *  - cursor-following glare sheen, kept subtle during touch gestures.
 *  - inner layers (children with translateZ) get real parallax because the
 *    inner wrapper keeps `transform-style: preserve-3d`.
 *
 * Touch devices use press + drag instead of hover: a finger can explore the
 * card depth without hijacking normal vertical page scrolling. Reduced-motion
 * preferences still disable the effect.
 */
export default function Tilt3D({
  children,
  className = "",
  max = 9,
  scale = 1.02,
  lift = 0,
  glare = false,
  glareClassName = "rounded-2xl",
  innerClassName = "",
}: {
  children: ReactNode;
  className?: string;
  /** Max tilt in degrees at the card edges. */
  max?: number;
  /** Scale while hovered. */
  scale?: number;
  /** Extra translateZ (px) while hovered — card pops toward the viewer. */
  lift?: number;
  /** Cursor-following sheen overlay (opt-in; default off). */
  glare?: boolean;
  /** Extra classes for the glare (border radius should match the card). */
  glareClassName?: string;
  innerClassName?: string;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const glareRef = useRef<HTMLSpanElement | null>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const suppressClickRef = useRef(false);
  const rectDirtyRef = useRef(true);
  const rafRef = useRef(0);
  const enabledRef = useRef(false);
  const touchActiveRef = useRef(false);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const gestureRef = useRef<"idle" | "undecided" | "tilt" | "scroll">("idle");
  const target = useRef({ rx: 0, ry: 0, s: 1, tz: 0 });
  const cur = useRef({ rx: 0, ry: 0, s: 1, tz: 0 });

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    enabledRef.current = !window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (typeof ResizeObserver === "undefined") return;
    const markDirty = () => {
      rectDirtyRef.current = true;
    };
    const observer = new ResizeObserver(markDirty);
    observer.observe(el);
    // getBoundingClientRect() goes stale after any scroll/resize — a cached
    // rect would compute wild tilt angles (e.g. 190deg) for cards far from
    // their original position. Re-measure lazily on demand instead.
    window.addEventListener("scroll", markDirty, { passive: true });
    window.addEventListener("resize", markDirty);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", markDirty);
      window.removeEventListener("resize", markDirty);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, []);

  const apply = () => {
    const el = innerRef.current;
    if (!el) return;
    const c = cur.current;
    el.style.setProperty("--rx", `${c.rx.toFixed(2)}deg`);
    el.style.setProperty("--ry", `${c.ry.toFixed(2)}deg`);
    el.style.setProperty("--s", c.s.toFixed(4));
    el.style.setProperty("--tz", `${c.tz.toFixed(1)}px`);
  };

  const tick = () => {
    const c = cur.current;
    const t = target.current;
    c.rx = lerp(c.rx, t.rx, 0.16);
    c.ry = lerp(c.ry, t.ry, 0.16);
    c.s = lerp(c.s, t.s, 0.16);
    c.tz = lerp(c.tz, t.tz, 0.16);
    const settled =
      Math.abs(c.rx - t.rx) < 0.02 &&
      Math.abs(c.ry - t.ry) < 0.02 &&
      Math.abs(c.s - t.s) < 0.0005 &&
      Math.abs(c.tz - t.tz) < 0.1;
    if (settled) {
      cur.current = { ...t };
      apply();
      rafRef.current = 0;
      return;
    }
    apply();
    rafRef.current = requestAnimationFrame(tick);
  };

  const ensureLoop = () => {
    if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
  };

  const tiltAt = (clientX: number, clientY: number) => {
    const el = hostRef.current;
    if (!el) return;
    el.dataset.tilting = "true";
    // Lazy re-measure: never trust a rect captured before the last scroll.
    if (rectDirtyRef.current || !rectRef.current) {
      rectRef.current = el.getBoundingClientRect();
      rectDirtyRef.current = false;
    }
    const r = rectRef.current;
    if (!r.width || !r.height) return;
    const nx = ((clientX - r.left) / r.width) * 2 - 1; // -1 .. 1
    const ny = ((clientY - r.top) / r.height) * 2 - 1;
    // Hard safety clamp: guards against any pathological rect/input values.
    const cx = Math.max(-1, Math.min(1, nx));
    const cy = Math.max(-1, Math.min(1, ny));
    target.current.rx = -cy * max;
    target.current.ry = cx * max;
    target.current.s = scale;
    target.current.tz = lift;
    const g = glareRef.current;
    if (g) {
      g.style.setProperty("--gx", `${(((clientX - r.left) / r.width) * 100).toFixed(1)}%`);
      g.style.setProperty("--gy", `${(((clientY - r.top) / r.height) * 100).toFixed(1)}%`);
    }
    ensureLoop();
  };

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!enabledRef.current) return;

    if (e.pointerType === "mouse") {
      tiltAt(e.clientX, e.clientY);
      return;
    }
    if (e.pointerType !== "touch" || !touchActiveRef.current) return;

    // Let a mostly vertical gesture remain a page scroll. A small horizontal
    // movement is the intentional "explore depth" gesture for the card.
    if (gestureRef.current === "undecided") {
      const dx = e.clientX - touchStartRef.current.x;
      const dy = e.clientY - touchStartRef.current.y;
      if (Math.hypot(dx, dy) < 8) return;
      gestureRef.current = Math.abs(dx) > Math.abs(dy) * 0.72 ? "tilt" : "scroll";
      if (gestureRef.current === "scroll") {
        touchActiveRef.current = false;
        release();
        return;
      }
      if (gestureRef.current === "tilt") {
        suppressClickRef.current = true;
        const el = hostRef.current;
        if (el) el.dataset.tilting = "true";
      }
    }
    if (gestureRef.current === "tilt") {
      const el = hostRef.current;
      if (el) el.dataset.tilting = "true";
      tiltAt(e.clientX, e.clientY);
    }
  };

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!enabledRef.current) return;
    if (e.pointerType === "mouse") {
      tiltAt(e.clientX, e.clientY);
      target.current.s = scale * 0.97;
      ensureLoop();
      return;
    }
    if (e.pointerType !== "touch") return;
    touchActiveRef.current = true;
    gestureRef.current = "undecided";
    touchStartRef.current = { x: e.clientX, y: e.clientY };
    // Give every press an immediate depth response; a vertical drag can still
    // hand control back to the page once its direction becomes clear.
    tiltAt(e.clientX, e.clientY);
    target.current.s = scale * 0.98;
    ensureLoop();
  };

  const release = () => {
    touchActiveRef.current = false;
    gestureRef.current = "idle";
    hostRef.current?.removeAttribute("data-tilting");
    target.current = { rx: 0, ry: 0, s: 1, tz: 0 };
    ensureLoop();
  };

  const onClickCapture = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) return;
    suppressClickRef.current = false;
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      ref={hostRef}
      className={`tilt-host ${className}`}
      style={{ perspective: "1100px" }}
      onPointerMove={onMove}
      onPointerDown={onDown}
      onPointerUp={release}
      onPointerCancel={() => {
        suppressClickRef.current = false;
        release();
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") release();
      }}
      onClickCapture={onClickCapture}
    >
      <div
        ref={innerRef}
        className={`tilt-inner h-full w-full ${innerClassName}`}
        style={{
          transform:
            "rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translateZ(var(--tz, 0px)) scale(var(--s, 1))",
          transformStyle: "preserve-3d",
        }}
      >
        {children}
        {glare && (
          <span
            ref={glareRef}
            aria-hidden="true"
            className={`tilt-glare ${glareClassName}`}
          />
        )}
      </div>
    </div>
  );
}
