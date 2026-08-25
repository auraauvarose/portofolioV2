"use client";

import { useEffect } from "react";

export default function CustomCursor() {
  useEffect(() => {
    const dot = document.getElementById("cursor-dot");
    const ring = document.getElementById("cursor-ring");
    if (!dot || !ring) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let ringX = targetX;
    let ringY = targetY;
    let raf = 0;
    let hover = false;

    const onMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      const t = e.target as HTMLElement | null;
      const interactive = !!t?.closest?.("a, button, [role='button'], input, [contenteditable]");
      if (interactive !== hover) {
        hover = interactive;
        ring.classList.toggle("cursor-ring-grow", hover);
      }
    };

    const tick = () => {
      ringX += (targetX - ringX) * 0.16;
      ringY += (targetY - ringY) * 0.16;
      dot.style.transform = `translate(${targetX}px, ${targetY}px) translate(-50%, -50%)`;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    document.body.classList.add("no-native-cursor");

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
      document.body.classList.remove("no-native-cursor");
    };
  }, []);

  return (
    <>
      <div
        id="cursor-dot"
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[99998] h-2 w-2 rounded-full bg-accent"
        style={{ willChange: "transform" }}
      />
      <div
        id="cursor-ring"
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[99997] h-9 w-9 rounded-full border border-white mix-blend-difference"
        style={{
          willChange: "transform",
          transition: "transform 0.25s ease-out, width 0.2s ease-out, height 0.2s ease-out, border-color 0.2s ease-out",
        }}
      />
    </>
  );
}
