"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import Tilt3D from "@/components/Tilt3D";
import MobileCarousel from "@/components/MobileCarousel";
import { useLanguage } from "@/components/providers";
import { useIsDesktop } from "@/lib/use-media-query";
import { caseStudy, work } from "@/lib/config";
import type { Project } from "@/types";

export default function Projects({
  items,
  embedded = false,
}: {
  items: Project[];
  embedded?: boolean;
}) {
  const { t, lang } = useLanguage();
  const isDesktop = useIsDesktop();
  const [active, setActive] = useState<string>("all");
  const [selected, setSelected] = useState<Project | null>(null);
  const [slide, setSlide] = useState(0);
  const [deskPage, setDeskPage] = useState(0);

  useEffect(() => {
    setSlide(0);
    setDeskPage(0);
  }, [active]);

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

  const categories = useMemo(() => {
    const set = new Set(items.map((p) => p.category));
    return Array.from(set);
  }, [items]);

  const filtered =
    active === "all" ? items : items.filter((p) => p.category === active);

  const projectCard = (project: Project, i: number) => {
    const title = lang === "en" ? project.title_en : project.title_id;
    const description =
      lang === "en"
        ? project.description_en ?? ""
        : project.description_id ?? project.description_en ?? "";

    return (
      <Tilt3D className="h-full" max={10} scale={1.035} lift={18} glare>
        <article
          onClick={() => setSelected(project)}
          className="group h-full cursor-pointer rounded-2xl border border-white/10 bg-panel shadow-[0_18px_50px_-24px_rgba(0,0,0,0.55)] transition-[border-color,box-shadow] duration-300 hover:border-accent/40 hover:shadow-[0_30px_70px_-28px_rgba(235,89,57,0.35)]"
        >
          <div
            className="tilt-layer relative aspect-[16/10] overflow-hidden rounded-t-2xl bg-black/40"
            style={{ "--tz": "34px" } as React.CSSProperties}
          >
            {project.image_url ? (
               
              <img
                src={project.image_url}
                alt={project.alt_text || title}
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/5 to-transparent">
                <span className="text-display text-4xl uppercase text-outline md:text-5xl">
                  {title}
                </span>
              </div>
            )}
            <div className="absolute left-3 top-3 flex items-center gap-2 md:left-4 md:top-4">
              <span className="rounded-full bg-black/60 px-2.5 py-1 text-[11px] uppercase tracking-widest text-[#ffffff] backdrop-blur md:px-3 md:text-xs">
                {project.year ?? project.category}
              </span>
            </div>
            {project.featured && (
              <span className="absolute right-3 top-3 rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-black md:right-4 md:top-4 md:text-[11px]">
                {t(work.professionalLabel)}
              </span>
            )}
          </div>

          <div
            className="tilt-layer p-5 md:p-6"
            style={{ "--tz": "52px" } as React.CSSProperties}
          >
            <div className="mb-3 flex items-start justify-between">
              <h3 className="text-display text-3xl uppercase text-white">
                {title}
              </h3>
              <span className="mt-1 text-xs uppercase tracking-widest text-gray-500">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              {description}
            </p>

            {project.tech_stack.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 md:mt-4">
                {project.tech_stack.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-md border border-white/10 px-2 py-0.5 text-[10px] text-gray-300 md:px-2.5 md:py-1 md:text-xs"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between gap-3 md:mt-5">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {/* Halaman case study internal — hanya bila project punya slug */}
                {project.slug && (
                  <a
                    href={`/work/${project.slug}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-accent hover:underline md:text-sm"
                  >
                    {t(caseStudy.readCaseStudy)}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </a>
                )}
                {project.link && (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-gray-400 transition-colors hover:text-accent md:text-sm"
                  >
                    {t(caseStudy.liveDemo)}
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 17L17 7M9 7h8v8" />
                    </svg>
                  </a>
                )}
                {!project.slug && !project.link && <span />}
              </div>
              <span className="hidden shrink-0 text-xs text-gray-500 sm:block">
                {t(work.clickToExpand)}
              </span>
            </div>
          </div>
        </article>
      </Tilt3D>
    );
  };

  const body = (
    <>
      <Reveal className="mb-10 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setActive("all")}
            className={`rounded-full px-5 py-2 text-sm uppercase tracking-widest transition-colors ${
              active === "all"
                ? "bg-accent text-black"
                : "border border-white/15 text-gray-300 hover:border-accent hover:text-accent"
            }`}
          >
            {t(work.allLabel)}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`rounded-full px-5 py-2 text-sm uppercase tracking-widest transition-colors ${
                active === cat
                  ? "bg-accent text-black"
                  : "border border-white/15 text-gray-300 hover:border-accent hover:text-accent"
              }`}
            >
              {cat}
            </button>
          ))}
        </Reveal>

        {filtered.length === 0 ? (
          <Reveal>
            <p className="rounded-2xl border border-white/10 bg-panel p-10 text-center text-gray-500">
              {t({
                en: "No projects yet — check back soon.",
                id: "Belum ada proyek — nantikan segera.",
              })}
            </p>
          </Reveal>
        ) : (
          <>
            {/* Mount only the active breakpoint's tree: both copies used to
                render (CSS-hidden), doubling cards, observers and image work. */}
            {isDesktop ? (
              <div className="hidden md:block">
                {(() => {
                  const pages = chunk(filtered, 2);
                  const idx = Math.min(deskPage, pages.length - 1);
                  return (
                    <MobileCarousel
                      total={pages.length}
                      idx={idx}
                      onSlide={setDeskPage}
                      revealClassName="h-auto"
                    >
                      <div className="grid gap-6 md:grid-cols-2">
                        {pages[idx].map((project, i) => (
                          <Reveal key={project.id} delay={i * 80} media className="h-full">
                            {projectCard(project, i)}
                          </Reveal>
                        ))}
                      </div>
                    </MobileCarousel>
                  );
                })()}
              </div>
            ) : (
              <div className="md:hidden">
                {(() => {
                  const idx = Math.min(slide, filtered.length - 1);
                  const current = filtered[idx];
                  const total = filtered.length;
                  return (
                    <MobileCarousel
                      total={total}
                      idx={idx}
                      onSlide={setSlide}
                    >
                      {projectCard(current, idx)}
                    </MobileCarousel>
                  );
                })()}
              </div>
            )}
          </>
        )}
    </>
  );

  const modal = selected && createPortal(
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black p-6"
            onClick={() => setSelected(null)}
            role="dialog"
            aria-modal="true"
            aria-label={selected.title_en ?? "Project"}
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
            className="max-h-[90vh] w-full max-w-2xl overflow-hidden overflow-y-auto rounded-2xl border border-white/10 bg-panel shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]"
            onClick={(e) => e.stopPropagation()}
          >
            {selected.image_url ? (
              <div className="relative aspect-[16/10] w-full bg-black/40">
                { }
                <img
                  src={selected.image_url}
                  alt={selected.alt_text || (lang === "en" ? selected.title_en : selected.title_id)}
                  className="h-full w-full object-cover"
                  decoding="async"
                />
              </div>
            ) : (
              <div className="flex aspect-[16/10] w-full items-center justify-center bg-gradient-to-br from-white/5 to-transparent">
                <span className="text-display text-5xl uppercase text-outline">
                  {lang === "en" ? selected.title_en : selected.title_id}
                </span>
              </div>
            )}
            <div className="px-5 py-5 md:px-6 md:py-6">
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-full bg-black/60 px-3 py-1 text-xs uppercase tracking-widest text-[#ffffff] backdrop-blur">
                  {selected.year ?? selected.category}
                </span>
                {selected.featured && (
                  <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-black">
                    {t(work.professionalLabel)}
                  </span>
                )}
              </div>
              <h3 className="text-display text-3xl uppercase text-white md:text-4xl">
                {lang === "en" ? selected.title_en : selected.title_id}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-gray-400 md:text-base">
                {lang === "en"
                  ? selected.description_en ?? ""
                  : selected.description_id ?? selected.description_en ?? ""}
              </p>

              {selected.tech_stack.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {selected.tech_stack.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-md border border-white/10 px-2.5 py-1 text-xs text-gray-300"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                {selected.slug && (
                  <a
                    href={`/work/${selected.slug}`}
                    className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-black transition-colors hover:bg-accent-soft"
                  >
                    {t(caseStudy.readCaseStudy)}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </a>
                )}
                {selected.link && (
                  <a
                    href={selected.link}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-accent hover:underline"
                  >
                    {t(caseStudy.liveDemo)}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 17L17 7M9 7h8v8" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>
          </div>
          ,
          document.body
        );

  if (embedded) {
    return (
      <>
        {body}
        {modal}
      </>
    );
  }

  return (
    <section id="work" className="px-6 py-16 md:px-10 md:py-32">
      <div className="mx-auto max-w-7xl">
        <SectionHeading kicker={work.kicker} heading={work.heading} index="06" />
        {body}
      </div>
      {modal}
    </section>
  );
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
