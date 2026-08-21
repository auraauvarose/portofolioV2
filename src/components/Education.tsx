"use client";

import Reveal from "@/components/Reveal";
import ScrollWordReveal from "@/components/ScrollWordReveal";
import { useLanguage } from "@/components/providers";
import { education } from "@/lib/config";

/**
 * Education — card boxes (school/degree/description) with scroll-linked word
 * reveal on the degree. On hover the whole card flips: background becomes the
 * orange accent and all text goes dark (ink) for contrast.
 */
export default function Education() {
  const { t } = useLanguage();

  return (
    <section className="px-6 py-16 md:px-10 md:py-32">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mb-12 flex items-center gap-4 text-sm uppercase tracking-widest text-gray-400">
          <span className="font-display text-accent">03</span>
          <span>{t(education.kicker)}</span>
          <span className="h-px flex-1 bg-white/10" />
        </Reveal>

        <div className="space-y-8">
          {education.items.map((item, i) => (
            <Reveal key={i}>
              <div className="group grid gap-6 rounded-2xl border border-white/10 bg-panel p-8 transition-colors duration-500 hover:border-ink/20 hover:bg-accent md:grid-cols-[240px_1fr] md:p-10">
                <div>
                  <p className="text-sm font-medium text-accent transition-colors duration-500 group-hover:text-ink">
                    {item.period}
                  </p>
                  <p className="mt-1 text-sm text-gray-400 transition-colors duration-500 group-hover:text-ink/70">
                    {t(item.location)}
                  </p>
                </div>
                <div>
                  <ScrollWordReveal
                    as="h3"
                    text={t(item.degree)}
                    baseOpacity={0.3}
                    scanRange={0.7}
                    className="text-display text-2xl uppercase text-white transition-colors duration-500 group-hover:text-ink md:text-3xl"
                  />
                  <p className="mt-1 text-sm uppercase tracking-widest text-gray-400 transition-colors duration-500 group-hover:text-ink/70">
                    {item.school}
                  </p>
                  <p className="mt-2 inline-block rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent transition-colors duration-500 group-hover:border-ink/30 group-hover:bg-ink/10 group-hover:text-ink">
                    {t(item.detail)}
                  </p>
                  <p className="mt-4 leading-relaxed text-gray-300 transition-colors duration-500 group-hover:text-ink/80">
                    {t(item.description)}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
