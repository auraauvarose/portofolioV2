"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import Tilt3D from "@/components/Tilt3D";
import { useLanguage } from "@/components/providers";
import { certifications } from "@/lib/config";
import type { Certification } from "@/types";

const CATEGORY_ORDER = ["internship", "professional", "technical"];

export default function Certifications({
  items,
}: {
  items: Certification[];
}) {
  const { t } = useLanguage();
  const [active, setActive] = useState<string>("all");
  const [selected, setSelected] = useState<Certification | null>(null);

  // Close the popup on Escape / lock body scroll while open.
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [selected]);

  const filtered =
    active === "all" ? items : items.filter((c) => c.category === active);

  return (
    <section className="px-6 py-16 md:px-10 md:py-32">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          kicker={certifications.kicker}
          heading={certifications.heading}
          index="05"
        />

        <Reveal className="mb-8 max-w-2xl text-gray-400">
          {t(certifications.description)}
        </Reveal>

        {/* Category filter */}
        <Reveal className="mb-10 flex flex-wrap gap-3">
          <button
            onClick={() => setActive("all")}
            className={`rounded-full px-5 py-2 text-sm uppercase tracking-widest transition-colors ${
              active === "all"
                ? "bg-accent text-black"
                : "border border-white/15 text-gray-300 hover:border-accent hover:text-accent"
            }`}
          >
            {t({ en: "All", id: "Semua" })}
          </button>
          {CATEGORY_ORDER.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`rounded-full px-5 py-2 text-sm uppercase tracking-widest transition-colors ${
                active === cat
                  ? "bg-accent text-black"
                  : "border border-white/15 text-gray-300 hover:border-accent hover:text-accent"
              }`}
            >
              {t(certifications.categories[cat])}
            </button>
          ))}
        </Reveal>

        {filtered.length === 0 ? (
          <Reveal>
            <p className="rounded-2xl border border-white/10 bg-panel p-10 text-center text-gray-500">
              {t({
                en: "No certifications yet — check back soon.",
                id: "Belum ada sertifikasi — nantikan segera.",
              })}
            </p>
          </Reveal>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((cert, i) => (
              <Reveal key={cert.id} delay={i * 80} className="h-full">
                <Tilt3D className="h-full">
                  <article
                    onClick={() => setSelected(cert)}
                    className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/10 bg-panel shadow-[0_18px_50px_-24px_rgba(0,0,0,0.6)] transition-all duration-500 hover:border-accent/50"
                  >
                    {cert.image_url ? (
                      <div className="relative aspect-[4/3] overflow-hidden bg-black/40">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={cert.image_url}
                          alt={cert.title_en}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-white/5 to-transparent">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="h-14 w-14 text-accent/50">
                          <path d="M9 12l2 2 4-4M5 4h14a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-6">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="rounded-full bg-accent/10 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-accent">
                          {t(certifications.categories[cert.category] ?? {
                            en: cert.category,
                            id: cert.category,
                          })}
                        </span>
                        {cert.date && (
                          <span className="text-xs text-gray-500">{cert.date}</span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold leading-snug text-white">
                        {lang_title(cert, t)}
                      </h3>
                      {cert.issuer && (
                        <p className="mt-2 text-sm text-gray-400">
                          {t({ en: "By:", id: "Oleh:" })} {cert.issuer}
                        </p>
                      )}
                      {cert.description_en && (
                        <p className="mt-3 text-sm leading-relaxed text-gray-400">
                          {t({
                            en: cert.description_en,
                            id: cert.description_id ?? cert.description_en,
                          })}
                        </p>
                      )}
                    </div>
                  </article>
                </Tilt3D>
              </Reveal>
            ))}
          </div>
        )}
      </div>

      {/* Certification popup — portaled to <body> so it escapes the ancestor
          `relative z-[1]` stacking context and can truly paint ABOVE the nav
          (z-100), social rail (z-40) and tv-static (z-90). */}
      {selected &&
        createPortal(
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black p-6"
            onClick={() => setSelected(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Certification"
          >
          <button
            type="button"
            onClick={() => setSelected(null)}
            aria-label="Close"
            className="absolute right-4 top-4 z-20 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-[#ffffff]/20 bg-black/50 text-[#ffffff] backdrop-blur-sm transition-colors hover:border-accent hover:text-accent sm:right-6 sm:top-6"
          >
            ✕
          </button>
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-panel shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]"
            onClick={(e) => e.stopPropagation()}
          >
            {selected.image_url ? (
              // Full-bleed image: natural aspect so there are no leftover
              // left/right bars — the popup focuses purely on the document.
              <div className="flex w-full items-center justify-center bg-black/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selected.image_url}
                  alt={selected.title_en ?? "Certification"}
                  className="max-h-[58vh] w-auto max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex aspect-[4/3] w-full items-center justify-center bg-gradient-to-br from-white/5 to-transparent">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="h-20 w-20 text-accent/50">
                  <path d="M9 12l2 2 4-4M5 4h14a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
                </svg>
              </div>
            )}
            <div className="px-5 py-5 md:px-6 md:py-6">
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-full bg-accent/10 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-accent">
                  {t(certifications.categories[selected.category] ?? {
                    en: selected.category,
                    id: selected.category,
                  })}
                </span>
                {selected.date && (
                  <span className="text-xs text-gray-500">{selected.date}</span>
                )}
              </div>
              <h3 className="text-xl font-semibold leading-snug text-white md:text-2xl">
                {lang_title(selected, t)}
              </h3>
              {selected.issuer && (
                <p className="mt-2 text-sm text-gray-400">
                  {t({ en: "By:", id: "Oleh:" })} {selected.issuer}
                </p>
              )}
              {selected.description_en && (
                <p className="mt-4 text-sm leading-relaxed text-gray-400 md:text-base">
                  {t({
                    en: selected.description_en,
                    id: selected.description_id ?? selected.description_en,
                  })}
                </p>
              )}
            </div>
          </div>
          </div>
          ,
          document.body
        )}
    </section>
  );
}

// Small helper so the component can pick title based on active language.
function lang_title(
  cert: Certification,
  t: (v: { en: string; id: string }) => string,
) {
  return t({ en: cert.title_en, id: cert.title_id });
}
