"use client";

import { useEffect, useRef, useState } from "react";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import About from "@/components/About";
import WhatIDo from "@/components/WhatIDo";
import Education from "@/components/Education";
import Certifications from "@/components/Certifications";
import TechStack from "@/components/TechStack";
import HowIWork from "@/components/HowIWork";
import Projects from "@/components/Projects";
import Gallery from "@/components/Gallery";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import Marquee from "@/components/Marquee";
import Sidebars from "@/components/Sidebars";
import CustomCursor from "@/components/CustomCursor";
import SpiderWalker from "@/components/SpiderWalker";
import type { Project, Certification, GalleryPhoto } from "@/types";

const GREETINGS = ["Hello", "Hola", "Ciao", "こんにちは", "Hallo"];
const GREET_MS = 320;
const HOLD_MS = 500;
const CURTAIN_MS = 700;
type Phase = "enter" | "show" | "exit";

export default function HomeClient({
  projects,
  certifications,
  gallery,
}: {
  projects: Project[];
  certifications: Certification[];
  gallery: GalleryPhoto[];
}) {
  const [phase, setPhase] = useState<Phase>("enter");
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const exitedRef = useRef(false);

  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(false);
  const scrollRAF = useRef(0);
  const scrollState = useRef({ top: true, bottom: false });

  useEffect(() => {
    const onScroll = () => {
      // rAF-throttle + early-exit: avoids re-rendering the whole tree on
      // every scroll event (multiple per frame on mobile).
      if (scrollRAF.current) return;
      scrollRAF.current = requestAnimationFrame(() => {
        scrollRAF.current = 0;
        const doc = document.documentElement;
        const top = window.scrollY <= 40;
        const bottom =
          window.scrollY > 40 &&
          window.innerHeight + window.scrollY >= doc.scrollHeight - 120;
        if (top === scrollState.current.top && bottom === scrollState.current.bottom)
          return;
        scrollState.current = { top, bottom };
        setAtTop(top);
        setAtBottom(bottom);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(scrollRAF.current);
    };
  }, []);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setPhase("show"));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (phase !== "show") return;
    let i = 0;
    const total = GREETINGS.length;
    const iv = setInterval(() => {
      i += 1;
      if (i < total) setIndex(i);
    }, GREET_MS);

    const go = setTimeout(() => {
      clearInterval(iv);
      setPhase("exit");
    }, GREET_MS * total + HOLD_MS);

    return () => {
      clearInterval(iv);
      clearTimeout(go);
    };
  }, [phase]);

  const finishClose = () => {
    if (exitedRef.current) return;
    exitedRef.current = true;
    setRevealed(true);
  };

  const curtainVisible = phase !== "enter";
  const curtainTransform = phase === "show" ? "translateY(0)" : "translateY(100%)";
  const curtainStyle = {
    transitionProperty: "transform",
    transitionDuration: `${CURTAIN_MS}ms`,
    transitionTimingFunction: "cubic-bezier(0.76, 0, 0.24, 1)",
    transform: curtainTransform,
  } as const;

  if (phase === "enter") {
    return <div className="fixed inset-0 bg-ink" aria-hidden="true" />;
  }

  return (
    <main className="relative min-h-screen overflow-x-clip bg-ink">
      {curtainVisible && !revealed && (
        <div
          className="loading-curtain fixed inset-0 z-[99999] overflow-hidden bg-ink"
          aria-hidden="true"
        >
          <div
            onTransitionEnd={(e) => {
              if (e.propertyName === "transform" && phase === "exit") {
                finishClose();
              }
            }}
            className="fixed inset-0 flex items-center justify-center bg-ink"
            style={curtainStyle}
          >
            <div className="relative flex flex-col items-center">
              <span
                key={GREETINGS[index]}
                className="text-display animate-preloader-word text-5xl uppercase tracking-tight text-white md:text-7xl"
              >
                {GREETINGS[index]}
                <span className="text-accent">.</span>
              </span>

              <div className="mt-8 h-px w-40 overflow-hidden bg-white/15">
                <div
                  className="h-full bg-accent transition-all duration-300 ease-out"
                  style={{ width: `${((index + 1) / GREETINGS.length) * 100}%` }}
                />
              </div>

              <span className="mt-6 text-[10px] uppercase tracking-[0.4em] text-white">
                Loading
              </span>
            </div>
          </div>
        </div>
      )}

      <Sidebars />
      <CustomCursor />
      <SpiderWalker />
      <div className="tv-static pointer-events-none fixed inset-0 z-[90]" />

      <div
        className={`pointer-events-none fixed right-6 bottom-8 z-[95] flex flex-col items-center gap-3 transition-all duration-500 ease-out lg:right-12 ${
          atTop || atBottom ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0"
        }`}
      >
          <span className="text-[13px] uppercase tracking-[0.4em] text-[#6b6b6b] [writing-mode:vertical-rl] dark:text-[#b7ab98]">
            SCROLL
          </span>
          <span
            className={`block ${
              atTop && !atBottom
                ? "animate-[scroll-hint-bob_1.4s_ease-in-out_infinite_alternate] motion-reduce:animate-none"
                : ""
            }`}
          >
            <svg
              width="18"
              height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`text-accent transition-transform duration-500 ease-out ${
              atBottom ? "rotate-180" : ""
            }`}
          >
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </span>
      </div>

      <Nav />
      <div className="sticky top-0 z-0 h-screen">
        <Hero />
      </div>

      <div className="relative z-[1] bg-ink">
        <Marquee label="AURA AUVAROSE" />

        <div className="relative z-10 -mt-4 w-full rounded-t-[2rem] bg-ink shadow-[0_-40px_80px_rgba(0,0,0,0.5)] dark:shadow-[0_-40px_80px_rgba(255,255,255,0.25)] [clip-path:inset(-130px_0_0_0)]">
          <About />
          <WhatIDo />
          <Education />
        </div>

        <Marquee label="FULLSTACK DEVELOPER" reverse />

        <Certifications items={certifications} />
        <TechStack />
        <HowIWork />

        <Marquee label="SOFTWARE ENGINEER" />

        <Projects items={projects} />
        <Gallery items={gallery} />
        <Contact />
        <Footer />
      </div>
    </main>
  );
}
