"use client";

import { useEffect, useRef, useState } from "react";
import { profile } from "@/lib/config";
import { useLanguage } from "@/components/providers";
import Tilt3D from "@/components/Tilt3D";

const DISC = 280;

export default function Hero() {
  const eyebrow = `${profile.name}`.toUpperCase();
  const { theme } = useLanguage();
  const [dim, setDim] = useState(0);
  const [active, setActive] = useState(false);
  const scrollRAF = useRef(0);
  const lastDim = useRef(0);

  const onMove = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.setProperty("--mx", `${e.clientX}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY}px`);
  };

  useEffect(() => {
    const onScroll = () => {
      // rAF-throttle: at most one setState per frame, skip if unchanged.
      if (scrollRAF.current) return;
      scrollRAF.current = requestAnimationFrame(() => {
        scrollRAF.current = 0;
        const d = Math.min(1, window.scrollY / window.innerHeight);
        if (Math.abs(d - lastDim.current) < 0.001) return;
        lastDim.current = d;
        setDim(d);
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
      id="top"
      onMouseMove={onMove}
      className="relative flex h-screen w-full items-center justify-center overflow-hidden px-4 text-ecru"
      style={{ "--mx": "-200px", "--my": "-200px" } as React.CSSProperties}
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
          opacity: theme === "dark" ? 0.35 + dim * 0.6 : 0,
        }}
      />

      <Tilt3D
        max={10}
        scale={1.05}
        innerClassName="hero-tilt-inner"
        className="absolute inset-0 animate-hero-float motion-reduce:animate-none will-change-transform"
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

      <div className="absolute -left-40 top-1/4 h-[40rem] w-[40rem] rounded-full bg-accent/10 hero-blur transition-[transform,background-color] duration-700 ease-out hover:scale-110 hover:bg-accent/20" />
      <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-accent/5 hero-blur transition-[transform,background-color] duration-700 ease-out hover:scale-110 hover:bg-accent/10" />

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
              SOFTWARE
              <br />
              ENGINEER
            </h1>
          </div>
        </div>
      </div>
    </section>
  );
}
