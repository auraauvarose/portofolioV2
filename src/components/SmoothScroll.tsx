"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { MotionConfig } from "motion/react";
import "lenis/dist/lenis.css";

// Module-level singleton so any component (footer back-to-top, etc.) can
// command the scroller without prop drilling or a context provider.
let lenis: Lenis | null = null;
export const getLenis = () => lenis;

export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Users who ask for less motion get the native scroller untouched.
    // Touch scrolling already has browser-level momentum. Letting Lenis
    // interpolate the same gesture adds a second scroll loop and makes text
    // rasterization compete with the finger on mobile.
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouchDevice = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    if (prefersReducedMotion || isTouchDevice) return;

    const instance = new Lenis({
      lerp: 0.11, // slightly weightier glide than the 0.1 default
      anchors: true, // nav #anchor links glide instead of jumping
      autoRaf: false, // driven manually below — only while scrolling
    });
    lenis = instance;

    // Lenis's autoRaf schedules requestAnimationFrame forever, even when the
    // page is perfectly idle. Drive it manually instead: the loop runs while
    // there was scroll activity in the last 200ms (Lenis emits "scroll" every
    // frame it advances, so the glide keeps its exact feel) and stops once
    // scrolling settles — zero idle frames, identical motion.
    let rafId = 0;
    let lastActivity = 0;
    const loop = (time: number) => {
      instance.raf(time);
      if (performance.now() - lastActivity > 200) {
        rafId = 0;
        return;
      }
      rafId = requestAnimationFrame(loop);
    };
    const arm = () => {
      lastActivity = performance.now();
      if (!rafId) rafId = requestAnimationFrame(loop);
    };

    instance.on("scroll", arm);
    window.addEventListener("scroll", arm, { passive: true });
    window.addEventListener("wheel", arm, { passive: true });
    window.addEventListener("touchmove", arm, { passive: true });
    const onVisible = () => {
      if (!document.hidden) arm();
    };
    document.addEventListener("visibilitychange", onVisible);
    arm();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      instance.off("scroll", arm);
      window.removeEventListener("scroll", arm);
      window.removeEventListener("wheel", arm);
      window.removeEventListener("touchmove", arm);
      document.removeEventListener("visibilitychange", onVisible);
      instance.destroy();
      lenis = null;
    };
  }, []);

  // One motion config for the whole page: motion components automatically
  // reduce to opacity-only when the user prefers reduced motion.
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
