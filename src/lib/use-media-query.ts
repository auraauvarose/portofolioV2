"use client";

import { useSyncExternalStore } from "react";

/** SSR-safe media query subscription. Server render always answers `false`
 *  (mobile-first, matching the pre-hydration markup), so hydration never
 *  flips unless the media query genuinely matches. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Desktop (≥768px) branch selector shared by the carousel sections so only
 *  one card tree is ever mounted. */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 768px)");
}
