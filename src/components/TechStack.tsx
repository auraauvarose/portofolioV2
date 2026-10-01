"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import Tilt3D from "@/components/Tilt3D";
import { useLanguage } from "@/components/providers";
import { useSiteContent } from "@/components/site-content-provider";
import { techIcon } from "@/components/tech-icons";
import { techDescriptions, techLinks } from "@/lib/config";
import type { Localized } from "@/types";

type TechCategory = { title: Localized; items: readonly string[] };

const UI: Record<string, Localized> = {
  technologies: { en: "technologies", id: "teknologi" },
  disciplines: { en: "disciplines", id: "disiplin" },
  all: { en: "All", id: "Semua" },
  filter: { en: "Filter by discipline", id: "Saring berdasarkan disiplin" },
  official: { en: "Official site", id: "Situs resmi" },
};

const CHEVRON =
  "M7 17 17 7M9 7h8v8";

function TechRow({ label }: { label: string }) {
  const { t } = useLanguage();
  const description = techDescriptions[label];
  const link = techLinks[label];

  const body = (
    <>
      <span className="ts-icon mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-black/10 bg-black/[0.03] text-zinc-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300">
        {techIcon(label, "h-4 w-4") ?? (
          <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-zinc-800 transition-colors duration-300 group-hover/row:text-accent dark:text-zinc-100">
          {label}
        </span>
        {description ? (
          <span className="mt-1 block text-xs leading-relaxed text-zinc-500 line-clamp-2 dark:text-zinc-400">
            {t(description)}
          </span>
        ) : null}
      </span>

      {link ? (
        <span className="mt-1 shrink-0 text-zinc-400 opacity-0 transition-opacity duration-300 group-hover/row:opacity-100 dark:text-zinc-500">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d={CHEVRON} />
          </svg>
          <span className="sr-only"> — {t(UI.official)}</span>
        </span>
      ) : null}
    </>
  );

  return (
    <li className="ts-row group/row relative rounded-2xl">
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="flex items-start gap-3 px-3 py-2.5 no-underline outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {body}
        </a>
      ) : (
        <div className="flex items-start gap-3 px-3 py-2.5">{body}</div>
      )}
    </li>
  );
}

export default function TechStack() {
  const { t } = useLanguage();
  const { techStack } = useSiteContent();
  const [solo, setSolo] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);

  const categories = useMemo(
    () => techStack.categories as readonly TechCategory[],
    [techStack.categories],
  );

  const total = useMemo(
    () => categories.reduce((sum, cat) => sum + cat.items.length, 0),
    [categories],
  );

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => el.classList.toggle("ts-halt", !entry?.isIntersecting),
      { rootMargin: "120px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative px-6 py-24 md:px-10 md:py-32">
      <style>{`
.ts-bg {
  background-image:
    radial-gradient(rgba(127,127,127,0.22) 1px, transparent 1px);
  background-size: 26px 26px;
}
.ts-dim {
  opacity: 0.22;
  filter: saturate(0.3);
  transform: scale(0.985);
}
.ts-card {
  transition:
    opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.55s cubic-bezier(0.16, 1, 0.3, 1),
    border-color 0.4s ease,
    box-shadow 0.4s ease;
}
/* Cincin hover: border-radius: inherit membuat garisnya mengikuti
   lengkung kartu (rounded-3xl), bukan garis lurus seperti corner bracket. */
.ts-card::before {
  content: "";
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  border: 1px solid var(--color-accent);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.4s ease;
  z-index: 2;
}
.ts-card::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: 0 0 0 1px var(--color-accent);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.4s ease;
  z-index: 1;
}
.ts-card:hover::before,
.ts-card:hover::after,
.ts-card:focus-within::before,
.ts-card:focus-within::after {
  opacity: 1;
}
.ts-row::before {
  content: "";
  position: absolute;
  left: 0;
  top: 2px;
  bottom: 2px;
  width: 2px;
  border-radius: 999px;
  background: var(--color-accent);
  transform: scaleY(0);
  transform-origin: center;
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.ts-row:hover::before,
.ts-row:focus-within::before {
  transform: scaleY(1);
}
.ts-icon {
  transition:
    background-color 0.3s ease,
    color 0.3s ease,
    transform 0.3s ease;
}
.ts-row:hover .ts-icon,
.ts-row:focus-within .ts-icon {
  background-color: var(--color-accent);
  color: var(--color-a-on-accent);
  transform: translateY(-1px);
}
.ts-pulse {
  animation: ts-pulse 2.4s ease-in-out infinite;
}
@keyframes ts-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(0.82); }
}
.ts-halt .ts-pulse { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) {
  .ts-pulse { animation: none; }
}
`}</style>

      <div aria-hidden className="ts-bg pointer-events-none absolute inset-0" />


      <div className="relative mx-auto max-w-7xl">
        <SectionHeading
          kicker={techStack.kicker}
          heading={techStack.heading}
          index="05"
        />

        <div className="mb-8 flex flex-col gap-4 border-y border-black/10 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 md:mb-10">
          <p className="flex items-center gap-3 font-data text-[11px] uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
            <span className="ts-pulse h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
            <span className="text-zinc-800 dark:text-zinc-100">{total}</span>
            <span>{t(UI.technologies)}</span>
            <span aria-hidden className="text-zinc-300 dark:text-zinc-700">
              /
            </span>
            <span className="text-zinc-800 dark:text-zinc-100">{categories.length}</span>
            <span>{t(UI.disciplines)}</span>
          </p>

          <div
            role="group"
            aria-label={t(UI.filter)}
            className="flex flex-wrap items-center gap-1.5"
          >
            <button
              type="button"
              aria-pressed={solo === null}
              onClick={() => setSolo(null)}
              className={`rounded-full border px-3.5 py-1.5 font-data text-[11px] uppercase tracking-[0.18em] transition-colors duration-300 outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                solo === null
                  ? "border-accent bg-accent text-[var(--color-a-on-accent)]"
                  : "border-black/10 text-zinc-500 hover:border-accent/50 hover:text-accent dark:border-white/10 dark:text-zinc-400"
              }`}
            >
              {t(UI.all)}
            </button>

            {categories.map((cat, i) => (
              <button
                key={cat.title.en}
                type="button"
                aria-pressed={solo === i}
                onClick={() => setSolo(solo === i ? null : i)}
                className={`rounded-full border px-3.5 py-1.5 font-data text-[11px] uppercase tracking-[0.18em] transition-colors duration-300 outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  solo === i
                    ? "border-accent bg-accent text-[var(--color-a-on-accent)]"
                    : "border-black/10 text-zinc-500 hover:border-accent/50 hover:text-accent dark:border-white/10 dark:text-zinc-400"
                }`}
              >
                <span className="sr-only">{t(cat.title)}</span>
                <span aria-hidden>0{i + 1}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12">
          {categories.map((cat, i) => (
            <Reveal
              key={cat.title.en}
              delay={i * 90}
              className={i % 2 === 0 ? "lg:col-span-7" : "lg:col-span-5"}
            >
              <Tilt3D
                className="h-full"
                max={7}
                scale={1.02}
                lift={22}
                glare
                glareClassName="rounded-3xl"
              >
                <section
                  aria-labelledby={`ts-cat-${i}`}
                  className={`ts-card relative h-full rounded-3xl border border-black/10 bg-panel p-5 shadow-[0_28px_70px_-46px_rgba(0,0,0,0.7)] md:p-6 dark:border-white/10 dark:shadow-[0_28px_70px_-46px_rgba(0,0,0,0.9)] ${
                    solo !== null && solo !== i ? "ts-dim" : ""
                  }`}
                >
                  <header className="flex items-baseline gap-3 border-b border-black/10 pb-4 dark:border-white/10">
                    <span className="font-display text-sm text-accent">
                      0{i + 1}
                    </span>
                    <h3
                      id={`ts-cat-${i}`}
                      className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-800 dark:text-zinc-100"
                    >
                      {t(cat.title)}
                    </h3>
                    <span className="ms-auto font-data text-[11px] text-zinc-400 dark:text-zinc-500">
                      {String(cat.items.length).padStart(2, "0")}
                    </span>
                  </header>

                  <ul className="mt-3 flex flex-col gap-0.5">
                    {cat.items.map((label) => (
                      <TechRow key={label} label={label} />
                    ))}
                  </ul>
                </section>
              </Tilt3D>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
