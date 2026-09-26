"use client";

import Link from "next/link";
import Reveal from "@/components/Reveal";
import { useLanguage } from "@/components/providers";
import { caseStudy } from "@/lib/config";
import type { Project } from "@/types";

function paragraphs(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function BackLink() {
  const { t } = useLanguage();
  return (
    <Link
      href="/#work"
      className="group inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gray-400 transition-colors hover:text-accent"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-transform duration-300 group-hover:-translate-x-1"
        aria-hidden="true"
      >
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      {t(caseStudy.back)}
    </Link>
  );
}

function ExternalArrow() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

function OtherProjectCard({ p }: { p: Project }) {
  const { lang } = useLanguage();
  const title = lang === "en" ? p.title_en : p.title_id || p.title_en;
  const description =
    lang === "en"
      ? p.description_en
      : p.description_id || p.description_en;

  return (
    <Link
      href={`/work/${p.slug}`}
      className="group flex flex-col border border-white/10 p-5 transition-colors duration-300 hover:border-accent/50"
    >
      <p className="text-[10px] uppercase tracking-[0.2em] text-accent">
        {p.category}
      </p>
      <h3 className="text-display mt-2 text-lg uppercase text-white transition-colors group-hover:text-accent">
        {title}
      </h3>
      {description && (
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-500">
          {description}
        </p>
      )}
    </Link>
  );
}

export default function CaseStudy({
  project,
  others,
}: {
  project: Project;
  others: Project[];
}) {
  const { t, lang } = useLanguage();

  const title = lang === "en" ? project.title_en : project.title_id || project.title_en;
  const altTitle = lang === "en" ? project.title_id : project.title_en;
  const description =
    lang === "en"
      ? project.description_en
      : project.description_id || project.description_en;
  const content =
    lang === "en"
      ? project.content_en || project.description_en
      : project.content_id || project.content_en || project.description_id;

  const body = paragraphs(content);

  return (
    <main className="relative min-h-[100dvh] bg-ink px-6 pb-24 pt-32 text-ecru md:px-10 md:pt-40">
      <div className="mx-auto max-w-3xl">
        <BackLink />

        <Reveal className="mt-8">
          <p className="text-[10px] uppercase tracking-[0.24em] text-accent">
            {project.category}
            {project.year ? ` · ${project.year}` : ""}
          </p>
          <h1 className="text-display mt-4 text-4xl uppercase leading-[0.95] text-white sm:text-5xl md:text-6xl">
            {title}
            <span className="text-accent">.</span>
          </h1>
          {altTitle && altTitle !== title && (
            <p className="mt-3 text-sm italic text-gray-500">{altTitle}</p>
          )}
        </Reveal>

        {project.image_url && (
          <Reveal className="mt-10">
            { }
            <img
              src={project.image_url}
              alt={project.alt_text || title}
              className="w-full border border-white/10 object-cover"
            />
          </Reveal>
        )}

        {project.tech_stack.length > 0 && (
          <Reveal className="mt-10">
            <p className="mb-3 text-[10px] uppercase tracking-[0.24em] text-gray-500">
              {t(caseStudy.techStack)}
            </p>
            <div className="flex flex-wrap gap-2">
              {project.tech_stack.map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-white/15 px-3 py-1 text-xs text-gray-300"
                >
                  {tech}
                </span>
              ))}
            </div>
          </Reveal>
        )}

        {body.length > 0 && (
          <div className="mt-12 flex flex-col gap-6">
            {body.map((para, i) => (
              <Reveal key={i} delay={i * 40}>
                <p className="text-base leading-[1.85] text-gray-300 sm:text-lg">
                  {para}
                </p>
              </Reveal>
            ))}
          </div>
        )}

        {body.length === 0 && description && (
          <p className="mt-12 text-base leading-[1.85] text-gray-400">
            {description}
          </p>
        )}

        {(project.link || project.repo_url) && (
          <Reveal className="mt-12 border-t border-white/10 pt-8">
            <p className="mb-4 text-[10px] uppercase tracking-[0.24em] text-gray-500">
              {t(caseStudy.links)}
            </p>
            <div className="flex flex-wrap gap-3">
              {project.link && (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-black transition-colors hover:bg-accent-soft"
                >
                  {t(caseStudy.liveDemo)}
                  <ExternalArrow />
                </a>
              )}
              {project.repo_url && (
                <a
                  href={project.repo_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-white/20 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:border-accent hover:text-accent"
                >
                  {t(caseStudy.sourceCode)}
                  <ExternalArrow />
                </a>
              )}
            </div>
          </Reveal>
        )}

        {others.length > 0 && (
          <Reveal className="mt-16 border-t border-white/10 pt-10">
            <p className="mb-6 text-[10px] uppercase tracking-[0.24em] text-gray-500">
              {t(caseStudy.otherProjects)}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((p) => (
                <OtherProjectCard key={p.id} p={p} />
              ))}
            </div>
          </Reveal>
        )}

        <div className="mt-16">
          <BackLink />
        </div>
      </div>
    </main>
  );
}
