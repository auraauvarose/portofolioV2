"use client";

import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import { useLanguage } from "@/components/providers";
import { experience } from "@/lib/config";

export default function Experience() {
  const { t } = useLanguage();

  return (
    <section className="px-6 py-16 md:px-10 md:py-32">
      <div className="mx-auto max-w-7xl">
        <SectionHeading kicker={experience.kicker} heading={{ en: "Career", id: "Karier" }} index="03" />

        <div className="space-y-6">
          {experience.items.map((item, i) => (
            <Reveal key={i}>
              <div className="group grid gap-6 rounded-2xl border border-white/10 bg-panel p-8 transition-colors hover:border-accent/40 md:grid-cols-[240px_1fr] md:p-10">
                <div>
                  <p className="text-sm font-medium text-accent">{item.period}</p>
                  <p className="mt-1 text-sm text-gray-400">{t(item.location)}</p>
                </div>
                <div>
                  <h3 className="text-display text-2xl uppercase text-white md:text-3xl">
                    {t(item.role)}
                  </h3>
                  <p className="mt-1 text-sm uppercase tracking-widest text-gray-400">
                    {item.company}
                  </p>
                  <p className="mt-4 leading-relaxed text-gray-300">
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
