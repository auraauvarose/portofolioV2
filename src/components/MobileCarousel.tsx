"use client";

import { useEffect, useRef } from "react";
import Reveal from "@/components/Reveal";

type Props = {
  total: number;
  idx: number;
  onSlide: (i: number) => void;
  /** ClassName for the Reveal wrapper (sizing). Default fills height. */
  revealClassName?: string;
  children: React.ReactNode;
};

/** Mobile-only single-card carousel. Controls (counter + arrows) sit ABOVE the
 *  card so they never overlap content; card re-mounts with a directional
 *  slide-in animation whenever the index changes. */
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
  useEffect(() => {
    prev.current = idx;
  }, [idx]);

  const go = (next: number) => onSlide((next + total) % total);

  return (
    <div>
      {/* Controls above the card — never cover the content. */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-gray-500">
          {String(idx + 1).padStart(2, "0")} /{" "}
          {String(total).padStart(2, "0")}
        </span>
        {total > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Sebelumnya"
              onClick={() => go(idx - 1)}
              className="carousel-arrow flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/60 text-white backdrop-blur transition-colors hover:border-accent hover:text-accent"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Berikutnya"
              onClick={() => go(idx + 1)}
              className="carousel-arrow flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/60 text-white backdrop-blur transition-colors hover:border-accent hover:text-accent"
            >
              ›
            </button>
          </div>
        )}
      </div>

      <Reveal className={revealClassName}>
        {/* key remount replays the slide-in animation on every index change */}
        <div key={idx} className={changed ? dir : ""}>
          {children}
        </div>
      </Reveal>

      {total > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {Array.from({ length: total }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => onSlide(i)}
              className={`h-2 w-2 rounded-full transition-all ${
                i === idx
                  ? "w-6 bg-accent"
                  : "bg-white/25 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
