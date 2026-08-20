"use client";

import { useEffect, useRef, useState } from "react";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import About from "@/components/About";
import WhatIDo from "@/components/WhatIDo";
import Experience from "@/components/Experience";
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
import type { Project, Certification, GalleryPhoto } from "@/types";

// Loading curtain timing (mirrors the former /loading page).
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
  // The curtain now runs on EVERY visit/reload (chosen behavior): it covers the
  // (already-rendered) content, then slides away to reveal it. No separate route
  // hop, no black boot screen — the loading appears immediately.
  const [phase, setPhase] = useState<Phase>("enter");
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const exitedRef = useRef(false);

  // Curtain "open": slide up from below the screen to cover it right after mount.
  useEffect(() => {
    const raf = requestAnimationFrame(() => setPhase("show"));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Greeting cycle while the curtain covers the screen.
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

  // Once the curtain has fully descended (off-screen), reveal the content.
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

  // While the curtain is animating in (phase "enter"), keep everything under a
  // plain ink screen so content doesn't flash before the curtain covers it.
  if (phase === "enter") {
    return <div className="fixed inset-0 bg-ink" aria-hidden="true" />;
  }

  // ponytail: overflow-x-clip, not -hidden. -hidden forces overflow-y auto and breaks sticky below.
  return (
    <main className="relative min-h-screen overflow-x-clip bg-ink">
      {/* Loading curtain — covers the whole page on every visit, then slides away
          and is removed from the DOM once revealed. */}
      {curtainVisible && !revealed && (
        <div
          className="fixed inset-0 z-[99999] overflow-hidden bg-ink"
          aria-hidden="true"
        >
          <div
            onTransitionEnd={(e) => {
              if (e.propertyName === "transform" && phase === "exit") {
                finishClose();
              }
            }}
            className="fixed inset-0 flex items-center justify-center bg-[#0D0E13]"
            style={curtainStyle}
          >
            <div className="pointer-events-none absolute h-[30rem] w-[30rem] rounded-full bg-accent/10 blur-[120px]" />

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

              <span className="mt-6 text-[10px] uppercase tracking-[0.4em] text-[#9ca3af]">
                Loading
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Fixed overlays */}
      <Sidebars />
      {/* Custom cursor (dot + ring) */}
      <CustomCursor />
      {/* Film-grain / TV-static overlay ("ants") */}
      <div className="tv-static pointer-events-none fixed inset-0 z-[90]" />

      <Nav />
      {/* Hero pins at top; the solid page below scrolls up and covers it */}
      <div className="sticky top-0 z-0 h-screen">
        <Hero />
      </div>

      {/* Solid page that scrolls UP and covers the hero — the "reveal under
          the fold" effect. Everything below the hero lives on this one opaque
          ink sheet (positioned z-[1] + bg-ink) so no later section lets the
          pinned hero show through, the way the non-positioned sections 05+
          used to. */}
      <div className="relative z-[1] bg-ink">
        {/* Marquee strip sits right under the hero */}
        <Marquee label="AURA AUVAROSE" />

        <div className="relative z-10 -mt-4 w-full rounded-t-[2rem] bg-ink shadow-[0_-40px_80px_rgba(0,0,0,0.5)]">
          <About />
          <WhatIDo />
          <Experience />
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
