"use client";

import { useEffect, useState } from "react";

// 3.5rem grown size / 2.25rem base box — must match .cursor-ring-grow in
// globals.css. Applied inside the inline transform below (instead of the
// standalone `scale` property) because that property would also scale the
// translate that positions the ring.
const RING_GROW_SCALE = 1.5556;

export default function CustomCursor() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      setEnabled(true);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const dot = document.getElementById("cursor-dot");
    const ring = document.getElementById("cursor-ring");
    if (!dot || !ring) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let ringX = targetX;
    let ringY = targetY;
    let raf = 0;
    let hover = false;
    let ringScale = 1;
    let dirty = false;

    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      dirty = true;
      const t = e.target as HTMLElement | null;
      const interactive = !!t?.closest?.("a, button, [role='button'], input, [contenteditable]");
      if (interactive !== hover) {
        hover = interactive;
        ringScale = hover ? RING_GROW_SCALE : 1;
        ring.classList.toggle("cursor-ring-grow", hover);
      }
      schedule();
    };

    const tick = () => {
      raf = 0;
      ringX += (targetX - ringX) * 0.16;
      ringY += (targetY - ringY) * 0.16;
      dot.style.transform = `translate(${targetX}px, ${targetY}px) translate(-50%, -50%)`;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%) scale(${ringScale})`;
      dirty = Math.abs(targetX - ringX) > 0.1 || Math.abs(targetY - ringY) > 0.1;
      if (dirty) schedule();
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    dot.style.transform = `translate(${targetX}px, ${targetY}px) translate(-50%, -50%)`;
    ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%) scale(${ringScale})`;
    document.body.classList.add("no-native-cursor");

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
      document.body.classList.remove("no-native-cursor");
    };
  }, [enabled]);

  if (!enabled) return null;

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
          transition: "transform 0.25s ease-out, border-color 0.2s ease-out",
        }}
      />
    </>
  );
}
