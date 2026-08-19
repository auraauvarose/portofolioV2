"use client";

import { useMemo, useState } from "react";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import Tilt3D from "@/components/Tilt3D";
import { useLanguage } from "@/components/providers";
import { work } from "@/lib/config";
import type { Project } from "@/types";

export default function Projects({ items }: { items: Project[] }) {
  const { t, lang } = useLanguage();
  const [active, setActive] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set(items.map((p) => p.category));
    return Array.from(set);
  }, [items]);

  const filtered =
    active === "all" ? items : items.filter((p) => p.category === active);

  return (
    <section id="work" className="px-6 py-16 md:px-10 md:py-32">
      <div className="mx-auto max-w-7xl">
        <SectionHeading kicker={work.kicker} heading={work.heading} index="08" />

        {/* Filter */}
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
          <div className="grid gap-6 md:grid-cols-2">
            {filtered.map((project, i) => {
              const isOpen = expanded === project.id;
              const title = lang === "en" ? project.title_en : project.title_id;
              const description =
                lang === "en"
                  ? project.description_en ?? ""
                  : project.description_id ?? project.description_en ?? "";

              return (
                <Reveal key={project.id} delay={(i % 2) * 80} className="h-full">
                  <Tilt3D className="h-full">
                    <article
                      onClick={() => setExpanded(isOpen ? null : project.id)}
                      className="group h-full cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-panel shadow-[0_18px_50px_-24px_rgba(0,0,0,0.55)] transition-all duration-500 hover:border-accent/50"
                    >
                    <div className="relative aspect-[16/10] overflow-hidden bg-black/40">
                      {project.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={project.image_url}
                          alt={title}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/5 to-transparent">
                          <span className="text-display text-5xl uppercase text-outline">
                            {title}
                          </span>
                        </div>
                      )}
                      <div className="absolute left-4 top-4 flex items-center gap-2">
                        <span className="rounded-full bg-black/60 px-3 py-1 text-xs uppercase tracking-widest text-[#ffffff] backdrop-blur">
                          {project.year ?? project.category}
                        </span>
                      </div>
                      {project.featured && (
                        <span className="absolute right-4 top-4 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-black">
                          {t(work.professionalLabel)}
                        </span>
                      )}
                    </div>

                    <div className="p-6">
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
                        <div className="mt-4 flex flex-wrap gap-2">
                          {project.tech_stack.map((tech) => (
                            <span
                              key={tech}
                              className="rounded-md border border-white/10 px-2.5 py-1 text-xs text-gray-300"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-5 flex items-center justify-between">
                        {project.link ? (
                          <a
                            href={project.link}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-accent hover:underline"
                          >
                            {t(work.viewCaseStudy)}
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M7 17L17 7M9 7h8v8" />
                            </svg>
                          </a>
                        ) : (
                          <span />
                        )}
                        <span className="text-xs text-gray-500">
                          {t(work.clickToExpand)}
                        </span>
                      </div>
                    </div>
                  </article>
                  </Tilt3D>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
