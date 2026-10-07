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

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-gray-500">
          {String(idx + 1).padStart(2, "0")} /{" "}
          {String(total).padStart(2, "0")}
        </span>
        {total > 1 && (
          <div className="flex items-center gap-2">
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
            if (!from || total < 2) return;
            const t = e.changedTouches[0];
            const dx = t.clientX - from.x;
            const dy = t.clientY - from.y;
            if (Math.abs(dx) < 44 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
            swiped.current = true;
            go(dx < 0 ? idx + 1 : idx - 1);
          }}
        >
          {children}
        </div>
      </Reveal>

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
