"use client";

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
import Preloader from "@/components/Preloader";
import CustomCursor from "@/components/CustomCursor";
import type { Project, Certification, GalleryPhoto } from "@/types";

export default function HomeClient({
  projects,
  certifications,
  gallery,
}: {
  projects: Project[];
  certifications: Certification[];
  gallery: GalleryPhoto[];
}) {
  // ponytail: overflow-x-clip, not -hidden. -hidden forces overflow-y auto and breaks sticky below.
  return (
    <main className="relative min-h-screen overflow-x-clip bg-ink">
      {/* Intro / loading overlay ("Hallo" in many languages) */}
      <Preloader />

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
