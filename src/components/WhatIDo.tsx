"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import ScrollWordReveal from "@/components/ScrollWordReveal";
import { useLanguage } from "@/components/providers";
import { whatIDo } from "@/lib/config";

export default function WhatIDo() {
  const { t, theme } = useLanguage();
  const [active, setActive] = useState<number | null>(null);
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: none)");
    setTouch(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setTouch(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const baseColor = theme === "dark" ? "#ffffff" : "#2F2F2F";
  const fullColor = theme === "dark" ? "#ff7a50" : "#b3391f";

  return (
    <section id="whatido" className="w-full">
      <div className="mx-auto flex max-w-6xl flex-col px-4 pt-2 pb-2 md:px-12 lg:pt-24 lg:pb-24 lg:px-20">
        <Reveal className="mb-10 flex items-center gap-4 text-sm uppercase tracking-[0.4em] text-gray-500 md:mb-14">
          <span>{t(whatIDo.kicker)}</span>
          <span className="h-px flex-1 bg-black/10 dark:bg-white/10" />
        </Reveal>

        {whatIDo.items.map((item, i) => (
          <div
            key={i}
            className={`group relative w-full ${active === i ? "is-active" : ""}`}
            onClick={
              touch ? () => setActive(active === i ? null : i) : undefined
            }
          >
            <div className="relative flex w-full flex-col justify-center overflow-hidden border-b border-black/10 py-5 md:py-8 dark:border-white/10">
              <ScrollWordReveal
                as="h2"
                text={t(item.title)}
                baseOpacity={0.3}
                scanRange={0.7}
                baseColor={baseColor}
                fullColor={fullColor}
                className="text-bevellier relative z-10 text-[14vw] uppercase leading-[0.9] text-[#2F2F2F] transition-colors duration-500 group-hover:text-black sm:text-[11vw] md:text-[9vw] lg:text-[110px] dark:text-white dark:group-hover:text-ink"
              />

              <p
                className={`relative z-10 mt-1 max-w-xs text-sm leading-relaxed text-black opacity-100 transition-all duration-700 ease-out md:absolute md:right-0 md:top-1/2 md:max-w-md md:-translate-y-1/2 md:translate-x-4 md:opacity-0 md:group-hover:translate-x-0 md:group-hover:opacity-100 dark:text-gray-400 dark:md:group-hover:text-white ${
                  active === i ? "!text-black dark:!text-black" : ""
                }`}
              >
                {t(item.description)}
              </p>
            </div>

            <div
              className={`absolute inset-y-0 left-1/2 z-0 w-[100vw] -translate-x-1/2 origin-bottom bg-accent transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] ${
                active === i ? "scale-y-100" : "scale-y-0"
              } md:group-hover:scale-y-100`}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
