"use client";

import Reveal from "@/components/Reveal";
import LetterReveal from "@/components/LetterReveal";
import ScrollWordReveal from "@/components/ScrollWordReveal";
import { useLanguage } from "@/components/providers";
import { about, profile } from "@/lib/config";

export default function About() {
  const { t, lang } = useLanguage();

  return (
    <section id="about" className="px-6 py-16 md:px-10 md:py-32">
      <div className="mx-auto max-w-7xl">
          <Reveal className="mb-8 flex items-center gap-4 text-sm uppercase tracking-widest text-gray-400">
            <span className="font-display text-accent">01</span>
            <span>{t(about.kicker)}</span>
            <span className="h-px flex-1 bg-white/10" />
          </Reveal>

          <h2 className="text-bevellier mb-12 max-w-4xl text-3xl uppercase leading-tight text-white sm:text-4xl md:text-6xl">
            <LetterReveal text={t(about.heading)} />
          </h2>

          <div className="max-w-4xl">
            <div className="space-y-7 text-xl leading-relaxed text-ecru md:text-2xl">
              {about.paragraphs.map((p, i) => (
                <ScrollWordReveal
                  key={i}
                  text={t(p)}
                  className="text-ecru"
                  baseOpacity={0.5}
                  scanRange={0.5}
                  highlight={p.highlight?.[lang] ?? []}
                  highlightClassName="text-highlight"
                />
              ))}
              <Reveal delay={240}>
                <a
                  href={profile.cvUrl}
                  className="group relative inline-flex items-center gap-3 py-1 text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:text-accent"
                >
                  {t(about.cta)}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="transition-transform duration-300 group-hover:translate-y-1"
                  >
                    <path d="M12 3v12M7 10l5 5 5-5M4 21h16" />
                  </svg>
                  {/* growing underline */}
                  <span className="absolute -bottom-1 left-0 h-px w-0 bg-accent transition-all duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:w-full" />
                </a>
              </Reveal>
            </div>
          </div>
        </div>
    </section>
  );
}
