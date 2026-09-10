"use client";

import { useEffect, useRef } from "react";

type SpotlightProps = {
  children: React.ReactNode;
  className?: string;
  /** Glow color as an rgb triple, e.g. "255,122,80" */
  color?: string;
};

/** Mouse-following radial glow for cards. Writes two CSS custom properties
 *  (--sx/--sy) directly on the node on pointermove — no React state, so
 *  hovering never triggers a re-render. Pure pointer decoration: hidden on
 *  touch via the hover media query in CSS. */
export default function Spotlight({
  children,
  className = "",
  color = "255,122,80",
}: SpotlightProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      rectRef.current = el.getBoundingClientRect();
    });
    observer.observe(el);
    rectRef.current = el.getBoundingClientRect();
    return () => observer.disconnect();
  }, []);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = rectRef.current ?? el.getBoundingClientRect();
    el.style.setProperty("--sx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--sy", `${e.clientY - rect.top}px`);
    el.style.setProperty("--sc", color);
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className={`spotlight relative ${className}`}
    >
      {children}
      <span aria-hidden="true" className="spotlight-glow" />
    </div>
  );
}
