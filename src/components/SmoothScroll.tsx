"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { MotionConfig } from "motion/react";
import "lenis/dist/lenis.css";

let lenis: Lenis | null = null;
export const getLenis = () => lenis;

export default function SmoothScroll({ children }: { children: ReactNode }) {
  // Efek terpisah dari Lenis: di bawah, Lenis di-skip untuk touch dan
  // reduced-motion, padahal titik background harus menyala di semua perangkat.
  useEffect(() => {
    const root = document.documentElement;
    const onScroll = () => {
      root.classList.toggle("is-scrolled", window.scrollY > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      root.classList.remove("is-scrolled");
    };
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouchDevice = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    if (prefersReducedMotion || isTouchDevice) return;

    const instance = new Lenis({
      lerp: 0.11,
      anchors: true,
      autoRaf: true,
    });
    lenis = instance;

    return () => {
      instance.destroy();
      lenis = null;
    };
  }, []);

  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
