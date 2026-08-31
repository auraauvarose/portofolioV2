"use client";

import { useState } from "react";
import Projects from "@/components/Projects";
import Gallery from "@/components/Gallery";
import Reveal from "@/components/Reveal";
import { useLanguage } from "@/components/providers";
import { showcase } from "@/lib/config";
import type { Project, GalleryPhoto } from "@/types";

type Tab = "work" | "gallery";

export default function Showcase({
  projects,
  gallery,
}: {
  projects: Project[];
  gallery: GalleryPhoto[];
}) {
  const { t } = useLanguage();
  const [active, setActive] = useState<Tab>("work");

  return (
    <section id="work" className="px-6 py-16 md:px-10 md:py-32">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mb-12 md:mb-16">
          <div className="flex items-center gap-4 text-sm uppercase tracking-widest text-gray-400">
            <span className="sh-index font-display text-accent">06</span>
            <span className="sh-kicker">{t(showcase.kicker)}</span>
            <span className="sh-line h-px flex-1 bg-white/10" />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-x-8 gap-y-6">
            <h2
              aria-label={t(showcase.heading)}
              className="text-bevellier bg-ink text-4xl uppercase text-white sm:text-5xl md:text-7xl"
            >
              {t(showcase.heading)
                .split(/\s+/)
                .filter(Boolean)
                .map((word, i, arr) => (
                  <span key={`${word}-${i}`} aria-hidden="true" className="sh-mask">
                    <span
                      className="sh-word"
                      style={{ transitionDelay: `${140 + i * 70}ms` }}
                    >
                      {word}
                      {i < arr.length - 1 ? "\u00A0" : ""}
                    </span>
                  </span>
                ))}
            </h2>

            <div className="flex flex-col items-end self-stretch">
              <span
                aria-hidden
                className="hidden w-px flex-1 bg-white/10 md:block"
              />
              <div className="inline-flex items-stretch">
                {(["work", "gallery"] as const).map((tab, i) => (
                  <button
                    key={tab}
                    onClick={() => setActive(tab)}
                    className={`-skew-x-6 border border-white/15 px-6 py-3 text-sm uppercase tracking-widest transition-colors md:px-10 md:py-4 md:text-base ${
                      i > 0 ? "-ml-px" : ""
                    } ${
                      active === tab
                        ? "bg-accent text-black"
                        : "text-gray-300 hover:bg-accent/10 hover:text-accent"
                    }`}
                  >
                    <span className="block skew-x-6">
                      {tab === "work" ? t(showcase.workTab) : t(showcase.galleryTab)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        {active === "work" ? (
          <Projects items={projects} embedded />
        ) : (
          <Gallery items={gallery} embedded />
        )}
      </div>
    </section>
  );
}
