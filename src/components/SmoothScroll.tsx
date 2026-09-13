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
      autoRaf: true, // Lenis must own its clock continuously
    });
    lenis = instance;

    // The raf loop has to run continuously, not only after wheel/touch input.
    // Both the footer SCROLL/TOP button and the nav anchors animate through
    // scrollTo(), which merely queues an lerp animation that advances inside
    // raf() — a hand-stopped idle loop left those animations frozen until an
    // unrelated native scroll event restarted it, so clicks appeared to do
    // nothing for seconds. Lenis cancels its own raf in destroy().
    return () => {
      instance.destroy();
      lenis = null;
    };
  }, []);

  // One motion config for the whole page: motion components automatically
  // reduce to opacity-only when the user prefers reduced motion.
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
