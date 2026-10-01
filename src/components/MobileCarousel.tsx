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
                className="carousel-arrow flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/60 text-white backdrop-blur transition-colors hover:border-accent hover:text-accent"
              >
                ‹
              </button>
            </Magnetic>
            <Magnetic strength={0.4}>
              <button
                type="button"
                aria-label="Berikutnya"
                onClick={() => go(idx + 1)}
                className="carousel-arrow flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/60 text-white backdrop-blur transition-colors hover:border-accent hover:text-accent"
              >
                ›
              </button>
            </Magnetic>
          </div>
        )}
      </div>

      <Reveal className={revealClassName}>
        <div key={idx} className={changed ? dir : ""}>
          {children}
        </div>
      </Reveal>

      {total > 1 && (
        // `gap-4` (16px), bukan `gap-2` (8px): dengan jarak 8px, dua titik hanya
        // berjarak 16px dari pusat ke pusat, sehingga area sentuh yang cukup
        // besar MUSTAHIL dibuat tanpa saling menutupi — dan titik yang tertutup
        // bukan sekadar sulit ditekan, ia memindahkan slide yang salah karena
        // elemen yang lebih belakang di DOM memenangkan hit-test.
        <div className="mt-4 flex items-center justify-center gap-4">
          {Array.from({ length: total }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ke slide ${i + 1}`}
              aria-current={i === idx ? "true" : undefined}
              onClick={() => onSlide(i)}
              // Area sentuh 24x44 px: ke samping 8px (tepat setengah `gap-4`,
              // jadi kotak dua titik bersinggungan tanpa saling menutupi), ke
              // atas/bawah 18px. Dengan perluasan ke samping yang lebih besar,
              // kotak titik pertama menutupi titik pertama itu sendiri dan klik
              // di sana malah berpindah ke slide berikutnya.
              className={`relative h-2 w-2 rounded-full transition-all after:absolute after:-inset-x-[8px] after:-inset-y-[18px] after:content-[''] ${
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
