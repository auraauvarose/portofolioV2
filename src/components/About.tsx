"use client";

import Reveal from "@/components/Reveal";
import LetterReveal from "@/components/LetterReveal";
import { useLanguage } from "@/components/providers";
import { about, profile } from "@/lib/config";

export default function About() {
  const { t } = useLanguage();

  return (
    <section id="about" className="px-6 py-16 md:px-10 md:py-32">
      <div className="mx-auto max-w-7xl">
          <Reveal className="mb-8 flex items-center gap-4 text-sm uppercase tracking-widest text-gray-400">
            <span className="font-display text-accent">01</span>
            <span>{t(about.kicker)}</span>
            <span className="h-px flex-1 bg-white/10" />
          </Reveal>

          <h2 className="text-display mb-12 max-w-4xl text-3xl uppercase leading-tight text-white sm:text-4xl md:text-6xl">
            <LetterReveal text={t(about.heading)} />
          </h2>

          <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
            <div className="space-y-6 text-lg leading-relaxed text-gray-300 md:text-xl">
              {about.paragraphs.map((p, i) => (
                <Reveal key={i} delay={i * 120}>
                  <p>{t(p)}</p>
                </Reveal>
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

            <Reveal delay={150}>
              <div className="glass rounded-2xl p-8">
                <p className="mb-6 text-xs uppercase tracking-widest text-gray-500">
                  {t(profile.location)}
                </p>
                <div className="space-y-4">
                  {["Fullstack", "Frontend", "Mobile", "Backend"].map(
                    (skill) => (
                      <div key={skill}>
                        <div className="mb-2 flex justify-between text-sm">
                          <span className="text-gray-200">{skill}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full w-[85%] rounded-full bg-accent" />
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
    </section>
  );
}
