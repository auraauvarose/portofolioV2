"use client";

import { useEffect, useState } from "react";
import { profile } from "@/lib/config";
import { useLanguage } from "@/components/providers";

/**
 * Hero — orange lens disc cursor reveal:
 * - small orange eyebrow with the full name
 * - huge faded watermark title "FULLSTACK / DEVELOPER"
 * - a polished orange lens disc (280px, #EB5939) follows the cursor and
 *   scales in with a slight overshoot. Inside it reveals "SOFTWARE /
 *   ENGINEER" in full color; the content layer is viewport-sized and offset
 *   by the inverse cursor position so the title stays centered while the
 *   disc moves (lens effect). Position is driven by CSS vars — no per-frame
 *   re-render. Disc is hidden by default and animates out on mouseleave.
 * - green pulsing "Available" pill
 */
const DISC = 280; // disc diameter; half used to center it on the cursor

export default function Hero() {
  const eyebrow = `${profile.name}`.toUpperCase();
  const { theme } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [dim, setDim] = useState(0); // 0..1 how far the reveal has covered the hero
  const [active, setActive] = useState(false);

  // Lens position via CSS vars — no per-frame re-render.
  const onMove = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.setProperty("--mx", `${e.clientX}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY}px`);
  };

  // Hide the scroll hint once the user scrolls past the hero, and dim the
  // background image as the reveal page scrolls up over the hero.
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      // Dim runs over ~1 viewport of scroll (matches the pin height).
      setDim(Math.min(1, window.scrollY / window.innerHeight));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section
      id="top"
      onMouseMove={onMove}
      className="relative flex h-screen w-full items-center justify-center overflow-hidden px-4 text-ecru"
      style={{ "--mx": "-200px", "--my": "-200px" } as React.CSSProperties}
    >
      {/* Background image — full-bleed cover layer, under the text. Two layers
          crossfade on theme switch: the dark artwork in dark mode, the light
          artwork in light mode. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-0 transition-opacity duration-700 ease-in-out dark:opacity-100"
        style={{ backgroundImage: "url(/background_heding.png)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-100 transition-opacity duration-700 ease-in-out dark:opacity-0"
        style={{ backgroundImage: "url(/background-light-mode.jpg)" }}
      />
      {/* Dark overlay to keep the headline readable; dims further as the
          sticky reveal page scrolls up over the hero. Dark mode: fixed black
          so it dims correctly. Light mode: none (the light artwork is already
          light, and the headline flips to dark ink). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-black transition-opacity duration-300"
        style={{
          opacity: theme === "dark" ? 0.35 + dim * 0.6 : 0,
        }}
      />

      {/* Ambient glow */}
      <div className="pointer-events-none absolute -left-40 top-1/4 h-[40rem] w-[40rem] rounded-full bg-accent/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-accent/5 blur-[100px]" />

      {/* Base content (visible outside the lens) */}
      <div className="relative z-10 flex w-full flex-col items-center justify-center px-4 text-center">
        <div
          className="relative"
          onMouseEnter={() => setActive(true)}
          onMouseLeave={() => setActive(false)}
        >
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.3em] text-[#EB5939] sm:text-base md:mb-8 md:text-xl">
            {eyebrow}
          </p>

          <h1 className="text-hero text-center text-[clamp(3.4rem,16vw,4.75rem)] uppercase leading-[1] text-[#ffffff]/60 transition-colors duration-300 dark:text-[#B7AB98]/60 sm:text-8xl md:text-[9.5rem] md:leading-[0.9] lg:text-[11.5rem]">
            FULLSTACK
            <br />
            DEVELOPER
          </h1>
        </div>
      </div>

      {/* Polished orange lens disc — follows cursor, reveals SOFTWARE/ENGINEER centered */}
      <div
        className="pointer-events-none fixed left-0 top-0 z-50 hidden lg:block"
        style={{
          transform: `translate(calc(var(--mx) - ${DISC / 2}px), calc(var(--my) - ${DISC / 2}px))`,
          willChange: "transform",
        }}
      >
        <div
          className={`relative overflow-hidden rounded-full bg-[#EB5939] transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            active ? "scale-100" : "scale-0"
          }`}
          style={{
            width: DISC,
            height: DISC,
            willChange: "transform",
            boxShadow:
              "0 0 60px 0 rgba(235,89,57,0.45), 0 0 140px 30px rgba(235,89,57,0.18)",
          }}
        >
          {/* Subtle top-left highlight for a softer, 3D feel */}
          <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_32%_28%,rgba(255,255,255,0.30),transparent_55%)]" />
          {/* Hairline inner ring for definition */}
          <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/20" />

          <div
            className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center select-none"
            style={{
              minWidth: "100vw",
              minHeight: "100vh",
              transform: `translate(calc(-1 * var(--mx) + ${DISC / 2}px), calc(-1 * var(--my) + ${DISC / 2}px))`,
            }}
          >
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.3em] text-black sm:text-base md:mb-8 md:text-xl">
              {eyebrow}
            </p>
            <h1 className="text-hero text-center text-[clamp(3.4rem,16vw,4.75rem)] uppercase leading-[1] text-black sm:text-8xl md:text-[9.5rem] md:leading-[0.9] lg:text-[11.5rem]">
              SOFTWARE
              <br />
              ENGINEER
            </h1>
          </div>
        </div>
      </div>

      {/* Vertical SCROLL hint — centered at the right-far edge, fades out on scroll */}
      <div
        className={`pointer-events-none absolute right-8 bottom-8 hidden items-center gap-4 transition-all duration-500 ease-out lg:flex ${
          scrolled ? "translate-x-6 opacity-0" : "translate-x-0 opacity-100"
        }`}
      >
        <span className="h-10 w-px origin-bottom scale-y-100 bg-accent/60" />
        <span className="text-[10px] uppercase tracking-[0.4em] text-[#6b6b6b] [writing-mode:vertical-rl] dark:text-[#b7ab98]">
          SCROLL
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-accent"
        >
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </div>
    </section>
  );
}
