"use client";

import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import { useLanguage } from "@/components/providers";
import { experienceSection } from "@/lib/config";
import type { Experience } from "@/types";

export default function ExperienceTimeline({ items }: { items: Experience[] }) {
  const { t, lang } = useLanguage();

  if (items.length === 0) return null;

  return (
    <section id="experience" className="px-6 py-16 md:px-10 md:py-32">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          kicker={experienceSection.kicker}
          heading={experienceSection.heading}
          index="03"
        />

        <Reveal className="mb-12 max-w-2xl text-gray-400">
          {t(experienceSection.description)}
        </Reveal>

        <ol className="relative">
          <span
            aria-hidden="true"
            className="absolute left-0 top-2 hidden h-[calc(100%-1rem)] w-px bg-white/10 md:block"
          />

          {items.map((item, i) => {
            const role = lang === "en" ? item.role_en : item.role_id || item.role_en;
            const description =
              lang === "en"
                ? item.description_en
                : item.description_id || item.description_en;

            const currentWords = ["sekarang", "present", "now", "kini", "saat ini"];
            const periodSaysCurrent = currentWords.some((w) =>
              (item.period ?? "").toLowerCase().includes(w),
            );

            return (
              <li key={item.id} className="relative md:pl-10">
                <Reveal delay={i * 70}>
                  <article className="mb-10 border-b border-white/10 pb-8 last:mb-0 last:border-0 last:pb-0">
                    <span
                      aria-hidden="true"
                      className={`absolute left-[-3.5px] top-2 hidden h-2 w-2 rounded-full md:block ${
                        item.current ? "bg-accent" : "bg-gray-600"
                      }`}
                    />

                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <h3 className="text-display text-xl uppercase text-white md:text-2xl">
                        {role}
                      </h3>
                      {item.period && (
                        <span
                          className={`text-xs uppercase tracking-widest ${
                            item.current ? "text-accent" : "text-gray-500"
                          }`}
                        >
                          {item.period}
                        </span>
                      )}
                    </div>

                    <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-gray-300">
                      {item.current && !periodSaysCurrent && (
                        <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-accent">
                          {t(experienceSection.present)}
                        </span>
                      )}
                      <span>
                      {item.company}
                      {item.location && (
                        <span className="text-gray-500"> · {item.location}</span>
                      )}
                      </span>
                    </p>

                    {description && (
                      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400">
                        {description}
                      </p>
                    )}
                  </article>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
