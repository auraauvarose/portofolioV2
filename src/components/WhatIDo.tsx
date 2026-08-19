"use client";

import Reveal from "@/components/Reveal";
import { useLanguage } from "@/components/providers";
import { whatIDo } from "@/lib/config";

/**
 * "What I Do" — matches the reference site: a stacked list of huge rows.
 * Each row reveals a full-width orange overlay on hover, the title flips to
 * black, and the description slides in from the right.
 */
export default function WhatIDo() {
  const { t } = useLanguage();

  return (
    <section className="w-full">
      <div className="mx-auto flex max-w-6xl flex-col px-4 pt-2 pb-2 md:px-12 lg:pt-24 lg:pb-24 lg:px-20">
        <Reveal className="mb-10 flex items-center gap-4 text-sm uppercase tracking-[0.4em] text-gray-500 md:mb-14">
          <span>{t(whatIDo.kicker)}</span>
          <span className="h-px flex-1 bg-black/10 dark:bg-white/10" />
        </Reveal>

        {whatIDo.items.map((item, i) => (
          <Reveal key={i} delay={i * 60}>
            <div className="group relative w-full">
              {/* Row content */}
              <div className="relative flex w-full flex-col justify-center overflow-hidden border-b border-black/10 py-5 md:py-8 dark:border-white/10">
                {/* title */}
                <h2 className="relative z-10 text-[14vw] font-black uppercase leading-[0.9] tracking-[-0.04em] text-[#2F2F2F] transition-colors duration-500 sm:text-[11vw] md:text-[9vw] md:group-hover:text-black lg:text-[110px] dark:text-[#B7AB98] dark:md:group-hover:text-white">
                  {t(item.title)}
                </h2>

                {/* description (slides in from right on hover) */}
                <p className="relative z-10 mt-1 max-w-xs text-sm leading-relaxed text-gray-600 opacity-100 transition-all duration-700 ease-out md:absolute md:right-0 md:top-1/2 md:max-w-md md:-translate-y-1/2 md:translate-x-4 md:opacity-0 md:group-hover:translate-x-0 md:group-hover:opacity-100 md:group-hover:text-black dark:text-gray-400 dark:md:group-hover:text-white">
                  {t(item.description)}
                </p>
              </div>

              {/* Full-width orange overlay grows from 0 on hover */}
              <div className="absolute inset-y-0 left-1/2 z-0 hidden w-[100vw] -translate-x-1/2 origin-center scale-y-0 bg-accent transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] md:group-hover:scale-y-100" />
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
