"use client";

import { useEffect, useRef } from "react";
import Reveal from "@/components/Reveal";
import Magnetic from "@/components/Magnetic";

type Props = {
  total: number;
  idx: number;
  onSlide: (i: number) => void;
  revealClassName?: string;
  children: React.ReactNode;
};

const ARROW =
  "carousel-arrow flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/60 text-white backdrop-blur transition-colors hover:border-accent hover:text-accent max-md:h-11 max-md:w-11";

const ARROW_SIDE =
  "carousel-arrow absolute top-1/2 hidden h-14 w-14 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white text-2xl font-bold text-black shadow-[0_10px_34px_-6px_rgba(0,0,0,0.85)] ring-1 ring-black/10 transition-[transform,background-color,color] duration-300 hover:scale-110 hover:bg-accent md:grid";

export default function MobileCarousel({
  total,
  idx,
  onSlide,
  revealClassName = "h-full",
  children,
}: Props) {
  const prev = useRef(idx);
  const changed = idx !== prev.current;
  const dir = idx > prev.current ? "slide-in-right" : "slide-in-left";
  const start = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);

  useEffect(() => {
    prev.current = idx;
  }, [idx]);

  const go = (next: number) => onSlide((next + total) % total);

  const endDrag = (dx: number, dy: number) => {
    if (total < 2) return;
    if (Math.abs(dx) < 44 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    swiped.current = true;
    go(dx < 0 ? idx + 1 : idx - 1);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between md:justify-center md:gap-6">
        <span className="text-xs uppercase tracking-widest text-gray-500">
          {String(idx + 1).padStart(2, "0")} /{" "}
          {String(total).padStart(2, "0")}
        </span>
        {total > 1 && (
          <div className="flex items-center gap-2 md:hidden">
            <Magnetic strength={0.4}>
              <button
                type="button"
                aria-label="Sebelumnya"
                onClick={() => go(idx - 1)}
                className={ARROW}
              >
                ‹
              </button>
            </Magnetic>
            <Magnetic strength={0.4}>
              <button
                type="button"
                aria-label="Berikutnya"
                onClick={() => go(idx + 1)}
                className={ARROW}
              >
                ›
              </button>
            </Magnetic>
          </div>
        )}
      </div>

      <div className="relative">
      <Reveal className={revealClassName}>
        <div
          key={idx}
          className={changed ? dir : ""}
          style={{ touchAction: "pan-y" }}
          onClickCapture={(e) => {
            if (!swiped.current) return;
            swiped.current = false;
            e.preventDefault();
            e.stopPropagation();
          }}
          onTouchStart={(e) => {
            const t = e.touches[0];
            start.current = { x: t.clientX, y: t.clientY };
          }}
          onTouchCancel={() => {
            start.current = null;
          }}
          onTouchEnd={(e) => {
            const from = start.current;
            start.current = null;
            if (!from) return;
            const t = e.changedTouches[0];
            endDrag(t.clientX - from.x, t.clientY - from.y);
          }}
          onMouseDown={(e) => {
            if (e.button !== 0) return;
            start.current = { x: e.clientX, y: e.clientY };
          }}
          onMouseLeave={() => {
            start.current = null;
          }}
          onMouseUp={(e) => {
            const from = start.current;
            start.current = null;
            if (!from) return;
            endDrag(e.clientX - from.x, e.clientY - from.y);
          }}
          onDragStart={(e) => e.preventDefault()}
        >
          {children}
        </div>
      </Reveal>

      {total > 1 && (
        <>
          <button
            type="button"
            aria-label="Sebelumnya"
            onClick={() => go(idx - 1)}
            className={`${ARROW_SIDE} -left-7`}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Berikutnya"
            onClick={() => go(idx + 1)}
            className={`${ARROW_SIDE} -right-7`}
          >
            ›
          </button>
        </>
      )}
      </div>

      {total > 1 && (
        <>
          <div className="m-rail mt-4 md:hidden" aria-hidden="true">
            <span
              className="block h-full rounded-full bg-accent transition-transform duration-500 ease-out"
              style={{
                width: `${100 / total}%`,
                transform: `translateX(${idx * 100}%)`,
              }}
            />
          </div>

          <div className="mt-4 flex items-center justify-center gap-4 max-md:hidden">
            {Array.from({ length: total }, (_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Ke slide ${i + 1}`}
                aria-current={i === idx ? "true" : undefined}
                onClick={() => onSlide(i)}
                className={`relative h-2 w-2 rounded-full transition-all after:absolute after:-inset-x-[8px] after:-inset-y-[18px] after:content-[''] ${
                  i === idx ? "w-6 bg-accent" : "bg-white/25 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
