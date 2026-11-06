"use client";

import { useEffect, useRef, useState } from "react";
import { useSiteContent } from "@/components/site-content-provider";
import { useLanguage } from "@/components/providers";
import Tilt3D from "@/components/Tilt3D";

const DISC = 280;
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
/* Judul dipecah dua supaya sisi kiri & kanan mengapit siluet karakter. */
const splitHalf = (text: string) => {
  const chars = Array.from(text);
  const cut = Math.ceil(chars.length / 2);
  return [chars.slice(0, cut).join(""), chars.slice(cut).join("")];
};

export default function Hero() {
  const { profile, hero } = useSiteContent();
  const { theme, t } = useLanguage();
  const eyebrow = `${profile.name}`.toUpperCase();
  const title1 = t(hero.titleLine1);
  const title2 = t(hero.titleLine2);
  const lens1 = t(hero.lensLine1);
  const lens2 = t(hero.lensLine2);
  const [title1L, title1R] = splitHalf(title1);
  const [title2L, title2R] = splitHalf(title2);
  const [lens1L, lens1R] = splitHalf(lens1);
  const [lens2L, lens2R] = splitHalf(lens2);
  const [active, setActive] = useState(false);
  const scrollRAF = useRef(0);
  const lastDim = useRef(0);
  const heroRef = useRef<HTMLElement>(null);
  const lensRef = useRef({ x: 0, y: 0, raf: 0 });
  const tiltRaf = useRef(0);
  const titlePointer = useRef({ x: 0, y: 0 });
  const titleRect = useRef<DOMRect | null>(null);

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
      className="relative flex h-screen w-full items-center justify-center overflow-hidden px-4 text-ecru max-md:h-[100svh]"
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
        className="pointer-events-none absolute inset-0 z-[1] animate-hero-float motion-reduce:animate-none md:z-[2]"
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

      <div className="relative z-[2] flex w-full flex-col items-center justify-center px-4 text-center md:z-[1]">
        <div
          className="hero-title-3d relative max-md:w-full max-md:self-stretch"
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

          <div className="hero-title-3d__stage relative max-md:w-full">
            <div
              className="hero-title-3d__depth text-hero text-[15vw] uppercase leading-[1] md:text-[13vw] md:leading-[0.9]"
              aria-hidden="true"
            >
              <div className="grid grid-cols-2 gap-0 md:gap-[24vw] dark:md:gap-[36vw]">
                <div className="text-right">
                  <span className="hero-title-3d__line">{title1L}</span>
                  <br />
                  <span className="hero-title-3d__line">{title2L}</span>
                </div>
                <div className="text-left">
                  <span className="hero-title-3d__line">{title1R}</span>
                  <br />
                  <span className="hero-title-3d__line">{title2R}</span>
                </div>
              </div>
            </div>
            <h1 className="hero-title-3d__heading text-hero text-[15vw] max-md:text-[32vw] uppercase leading-[1] text-[#ffffff]/90 transition-colors duration-300 dark:text-[#ffffff]/90 md:text-[13vw] md:leading-[0.9]">
              <span className="flex w-full flex-col text-left md:hidden">
                <span>{title1L}</span>
                <span>{title1R}</span>
                <span className="self-end text-right">{title2L}</span>
                <span className="self-end text-right">{title2R}</span>
              </span>
              <div className="hidden grid-cols-2 gap-0 md:grid md:gap-[24vw] dark:md:gap-[36vw]">
                <div className="text-right">
                  <span>{title1L}</span>
                  <br />
                  <span>{title2L}</span>
                </div>
                <div className="text-left">
                  <span>{title1R}</span>
                  <br />
                  <span>{title2R}</span>
                </div>
              </div>
            </h1>
          </div>
        </div>
      </div>

      <div
        className="pointer-events-none fixed left-0 top-0 z-50 hidden lg:block"
        aria-hidden="true"
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
            <div className="text-hero text-[15vw] uppercase leading-[1] text-black md:text-[13vw] md:leading-[0.9]">
              <div className="grid grid-cols-2 gap-0 md:gap-[24vw] dark:md:gap-[36vw]">
                <div className="text-right">
                  <span>{lens1L}</span>
                  <br />
                  <span>{lens2L}</span>
                </div>
                <div className="text-left">
                  <span>{lens1R}</span>
                  <br />
                  <span>{lens2R}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
