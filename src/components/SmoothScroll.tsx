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
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const instance = new Lenis({
      lerp: 0.11, // slightly weightier glide than the 0.1 default
      anchors: true, // nav #anchor links glide instead of jumping
      autoRaf: true,
    });
    lenis = instance;
    return () => {
      instance.destroy();
      lenis = null;
    };
  }, []);

  // One motion config for the whole page: motion components automatically
  // reduce to opacity-only when the user prefers reduced motion.
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
