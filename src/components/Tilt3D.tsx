"use client";

import { useRef } from "react";
import type { ReactNode, PointerEvent } from "react";

export default function Tilt3D({
  children,
  className = "",
  max = 9,
  scale = 1.02,
  innerClassName = "",
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  scale?: number;
  innerClassName?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  const reset = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--s", "1");
  };

  const tiltAt = (clientX: number, clientY: number, tiltScale: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const px = (clientX - r.left) / r.width - 0.5;
    const py = (clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${(-py * max).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(px * max).toFixed(2)}deg`);
    el.style.setProperty("--s", `${tiltScale}`);
  };

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    tiltAt(e.clientX, e.clientY, scale);
  };
  const onDown = (e: PointerEvent<HTMLDivElement>) => tiltAt(e.clientX, e.clientY, scale * 0.96);
  const onLeave = () => reset();
  const onUp = () => reset();

  return (
    <div
      ref={ref}
      className={className}
      style={{ perspective: "1000px" }}
      onPointerMove={onMove}
      onPointerDown={onDown}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerLeave={onLeave}
    >
      <div
        className={`h-full w-full transition-transform duration-200 ease-out will-change-transform ${innerClassName}`}
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
