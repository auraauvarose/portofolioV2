"use client";

import { useEffect, useRef } from "react";

export default function Marquee({
  label,
  reverse = false,
}: {
  label: string;
  reverse?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const skewRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const skewEl = skewRef.current;
    if (!wrap || !skewEl) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // rAF loop runs only while the marquee is on screen AND the scroll skew
    // has not settled: once it eases back to straight the loop stops until
    // the next scroll event. Transform-only (compositor), same visuals.
    let visible = false;
    let raf = 0;
    let lastY = window.scrollY;
    let skew = 0;

    const tick = () => {
      raf = 0;
      if (!visible) return;
      const y = window.scrollY;
      const v = y - lastY;
      lastY = y;
      const target = Math.max(-7, Math.min(7, v * 0.3));
      skew += (target - skew) * 0.1;
      if (target === 0 && Math.abs(skew) < 0.02) {
        // Fully settled: snap straight and stop scheduling frames.
        if (skew !== 0) {
          skew = 0;
          skewEl.style.transform = "skewX(0deg)";
        }
        return;
      }
      skewEl.style.transform = `skewX(${skew.toFixed(2)}deg)`;
      raf = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (visible && !raf) raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? false;
        // Offscreen: pause both the infinite translateX loop and its layer
        // hints. The visual state is unchanged when the marquee is visible.
        trackRef.current?.classList.toggle("marquee-paused", !visible);
        if (visible) {
          lastY = window.scrollY;
          wake();
        }
      },
      { threshold: 0 },
    );
    io.observe(wrap);
    window.addEventListener("scroll", wake, { passive: true });

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", wake);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const copy = (keyPrefix: string) =>
    Array.from({ length: 4 }, (_, i) => (
      <span
        key={`${keyPrefix}-${i}`}
        className="flex items-center gap-8 whitespace-nowrap"
      >
        <span
          className="text-comico text-5xl uppercase text-outline md:text-8xl"
          style={{ lineHeight: 1 }}
        >
          {label}
        </span>
        <span
          className="inline-flex shrink-0 translate-y-[-0.09em] items-center justify-center text-5xl md:text-8xl"
          style={{ lineHeight: 1 }}
        >
          <span className="text-3xl leading-none text-accent md:text-5xl ">

          </span>
        </span>
      </span>
    ));

  return (
    <div
      ref={wrapRef}
      className="marquee-mask relative z-[1] overflow-hidden border-y border-white/5 bg-ink py-6"
    >
      <div
        ref={trackRef}
        className={`flex w-max ${reverse ? "animate-marquee-reverse" : "animate-marquee"}`}
      >
        <div ref={skewRef} className="flex w-max">
          {copy("a")}
          {copy("b")}
        </div>
      </div>
    </div>
  );
}
