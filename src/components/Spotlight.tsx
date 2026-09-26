"use client";

import { useEffect, useRef } from "react";

type SpotlightProps = {
  children: React.ReactNode;
  className?: string;
  color?: string;
};

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
