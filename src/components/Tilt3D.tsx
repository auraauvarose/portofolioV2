"use client";

import { useRef } from "react";
import type { ReactNode, PointerEvent } from "react";

/**
 * Tilt3D — wraps a card and tilts it in 3D toward the cursor.
 *
 * The outer wrapper carries the `perspective`; the inner layer rotates around
 * X/Y based on the pointer position (driven by CSS vars, no re-render on
 * move) and scales up slightly, giving the card a tactile "lift toward you"
 * effect. Pointer events pass straight through so any onClick on the children
 * (e.g. a project's expand toggle) still works normally.
 */
export default function Tilt3D({
  children,
  className = "",
  max = 9,
  scale = 1.02,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  scale?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const px = (e.clientX - r.left) / r.width - 0.5; // -0.5 .. 0.5
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${(-py * max).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(px * max).toFixed(2)}deg`);
    el.style.setProperty("--s", `${scale}`);
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--s", "1");
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{ perspective: "1000px" }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <div
        className="h-full w-full transition-transform duration-200 ease-out will-change-transform"
        style={{
          transform:
            "rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) scale(var(--s, 1))",
          transformStyle: "preserve-3d",
        }}
      >
        {children}
      </div>
    </div>
  );
}
