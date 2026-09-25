"use client";

import { useEffect, useRef, useState } from "react";
import { useSiteContent } from "@/components/site-content-provider";
import { useLanguage } from "@/components/providers";
import Tilt3D from "@/components/Tilt3D";

const DISC = 280;
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export default function Hero() {
  const { profile, hero } = useSiteContent();
  const { theme, t } = useLanguage();
  const eyebrow = `${profile.name}`.toUpperCase();
  const title1 = t(hero.titleLine1);
  const title2 = t(hero.titleLine2);
  const lens1 = t(hero.lensLine1);
  const lens2 = t(hero.lensLine2);
  const [active, setActive] = useState(false);
  const [backgroundHovered, setBackgroundHovered] = useState(false);
  const scrollRAF = useRef(0);
  const lastDim = useRef(0);
  const heroRef = useRef<HTMLElement>(null);
  const lensRef = useRef({ x: 0, y: 0, raf: 0 });
  const tiltRaf = useRef(0);
  const titlePointer = useRef({ x: 0, y: 0 });
  const titleRect = useRef<DOMRect | null>(null);

  // Cache the title rect once (and on resize) instead of forcing layout on
  // every pointermove — the hero title never moves in the layout.
  useEffect(() => {
    const el = heroRef.current?.querySelector<HTMLElement>(".hero-title-3d");
    if (!el) return;
    const cache = () => {
      titleRect.current = el.getBoundingClientRect();
    };
    cache();
    window.addEventListener("resize", cache);
    return () => window.removeEventListener("resize", cache);
  }, []);

  const onMove = (e: React.MouseEvent<HTMLElement>) => {
    // Coalesce CSS var writes to one per frame — mousemove fires faster than
    // the display refreshes, and each write restyles the whole hero subtree.
    const el = e.currentTarget;
    lensRef.current.x = e.clientX;
    lensRef.current.y = e.clientY;
    if (lensRef.current.raf) return;
    lensRef.current.raf = requestAnimationFrame(() => {
      lensRef.current.raf = 0;
      el.style.setProperty("--mx", `${lensRef.current.x}px`);
      el.style.setProperty("--my", `${lensRef.current.y}px`);
    });
  };

  const onTitleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // Touch moves belong to native page scrolling, and narrow viewports keep
    // the headline completely flat. Avoid scheduling 3D CSS-variable writes
    // on mobile even when a browser reports a fine pointer.
    if (e.pointerType !== "mouse" || window.matchMedia("(max-width: 767px)").matches) return;
    const el = e.currentTarget;
    titlePointer.current = { x: e.clientX, y: e.clientY };
    if (tiltRaf.current) return;
    tiltRaf.current = requestAnimationFrame(() => {
      tiltRaf.current = 0;
      const rect = titleRect.current;
      if (!rect || !rect.width || !rect.height) return;
      const x = clamp((titlePointer.current.x - rect.left) / rect.width - 0.5, -0.5, 0.5);
      const y = clamp((titlePointer.current.y - rect.top) / rect.height - 0.5, -0.5, 0.5);
      el.style.setProperty("--title-rotate-x", `${(-y * 12).toFixed(2)}deg`);
      el.style.setProperty("--title-rotate-y", `${(x * 18).toFixed(2)}deg`);
      el.style.setProperty("--title-depth", `${(Math.abs(x) * 34).toFixed(1)}px`);
      el.style.setProperty("--title-shift-x", `${(x * 22).toFixed(1)}px`);
    });
  };

  const resetTitleTilt = (element: HTMLDivElement) => {
    element.style.setProperty("--title-rotate-x", "0deg");
    element.style.setProperty("--title-rotate-y", "0deg");
    element.style.setProperty("--title-depth", "0px");
    element.style.setProperty("--title-shift-x", "0px");
  };

  const onTitlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const onTitlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") {
      resetTitleTilt(e.currentTarget);
    }
  };

  useEffect(() => {
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;

    const onScroll = () => {
      // rAF-throttled, write-only: updates a CSS variable instead of calling
      // setState, so scrolling never re-renders the Hero subtree. The dim
      // overlay resolves the value in CSS via --hero-dim.
      if (scrollRAF.current) return;
      scrollRAF.current = requestAnimationFrame(() => {
        scrollRAF.current = 0;
        const d = Math.min(1, window.scrollY / window.innerHeight);
        if (Math.abs(d - lastDim.current) < 0.001) return;
        lastDim.current = d;
        heroRef.current?.style.setProperty("--hero-dim", String(d));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(scrollRAF.current);
    };
  }, []);

  return (
    <section
      ref={heroRef}
      id="top"
      onMouseMove={onMove}
      className="relative flex h-screen w-full items-center justify-center overflow-hidden px-4 text-ecru"
      style={{ "--mx": "-200px", "--my": "-200px", "--hero-dim": 0 } as React.CSSProperties}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-0 transition-opacity duration-700 ease-in-out dark:opacity-100"
        style={{ backgroundImage: "url(/photo/dakmode-bg.webp)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-100 transition-opacity duration-700 ease-in-out dark:opacity-0"
        style={{ backgroundImage: "url(/photo/lightmode-bg.webp)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-black transition-opacity duration-300"
        style={{
          opacity: theme === "dark" ? "calc(0.35 + var(--hero-dim, 0) * 0.6)" : 0,
        }}
      />

      <Tilt3D
        max={10}
        scale={1.05}
        innerClassName="hero-tilt-inner"
        className="absolute inset-0 animate-hero-float motion-reduce:animate-none"
      >
        <img
          aria-hidden="true"
          alt=""
          src="/photo/character-dark.webp"
          decoding="async"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700 ease-in-out dark:opacity-100"
        />
        <img
          aria-hidden="true"
          alt=""
          src="/photo/character-light.webp"
          decoding="async"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-100 transition-opacity duration-700 ease-in-out dark:opacity-0"
        />
      </Tilt3D>

      <div
        aria-hidden="true"
        onMouseEnter={() => setBackgroundHovered(true)}
        onMouseLeave={() => setBackgroundHovered(false)}
        className={`absolute -left-40 top-1/4 h-[40rem] w-[40rem] rounded-full bg-accent/10 hero-blur transition-[transform,background-color] duration-700 ease-out ${
          backgroundHovered ? "scale-110 bg-accent/20" : ""
        }`}
      />
      <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-accent/5 hero-blur transition-[transform,background-color] duration-700 ease-out hover:scale-110 hover:bg-accent/10" />

      <div className="relative z-10 flex w-full flex-col items-center justify-center px-4 text-center">
        <div
          className="hero-title-3d relative"
          onPointerMove={onTitleMove}
          onPointerDown={onTitlePointerDown}
          onPointerUp={onTitlePointerUp}
          onPointerCancel={onTitlePointerUp}
          onPointerEnter={() => setActive(true)}
          onPointerLeave={(e) => {
            setActive(false);
            resetTitleTilt(e.currentTarget);
          }}
        >
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.3em] text-[#EB5939] sm:text-base md:mb-8 md:text-xl">
            {eyebrow}
          </p>

          <div className="hero-title-3d__stage relative">
            <div
              className="hero-title-3d__depth text-hero text-center text-[clamp(3.4rem,16vw,4.75rem)] uppercase leading-[1] sm:text-8xl md:text-[9.5rem] md:leading-[0.9] lg:text-[11.5rem]"
              aria-hidden="true"
            >
              <span className="hero-title-3d__line">{title1}</span>
              <br />
              <span className="hero-title-3d__line">{title2}</span>
            </div>
            <h1 className="hero-title-3d__heading text-hero text-center text-[clamp(3.4rem,16vw,4.75rem)] uppercase leading-[1] text-[#ffffff]/90 transition-colors duration-300 dark:text-[#ffffff]/90 sm:text-8xl md:text-[9.5rem] md:leading-[0.9] lg:text-[11.5rem]">
              <span>{title1}</span>
              <br />
              <span>{title2}</span>
            </h1>
          </div>
        </div>
      </div>

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
          <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_32%_28%,rgba(255,255,255,0.30),transparent_55%)]" />
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
              {lens1}
              <br />
              {lens2}
            </h1>
          </div>
        </div>
      </div>
    </section>
  );
}
