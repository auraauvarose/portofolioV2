"use client";

import Reveal from "@/components/Reveal";
import { useLanguage } from "@/components/providers";
import { education } from "@/lib/config";

export default function Education() {
  const { t } = useLanguage();

  return (
    <section className="px-6 py-16 md:px-10 md:py-32">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mb-12 flex items-center gap-4 text-sm uppercase tracking-widest text-gray-400">
          <span className="font-display text-accent">04</span>
          <span>{t(education.kicker)}</span>
          <span className="h-px flex-1 bg-white/10" />
        </Reveal>

        {education.items.map((item, i) => (
          <Reveal key={i}>
            <div className="grid gap-6 rounded-2xl border border-white/10 bg-panel p-8 md:grid-cols-[240px_1fr] md:p-10">
              <div>
                <p className="text-sm font-medium text-accent">{item.period}</p>
                <p className="mt-1 text-sm text-gray-400">{t(item.location)}</p>
              </div>
              <div>
                <h3 className="text-display text-2xl uppercase text-white md:text-3xl">
                  {item.school}
                </h3>
                <p className="mt-1 text-sm uppercase tracking-widest text-gray-400">
                  {t(item.degree)}
                </p>
                <p className="mt-2 inline-block rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                  {t(item.detail)}
                </p>
                <p className="mt-4 leading-relaxed text-gray-300">
                  {t(item.description)}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
