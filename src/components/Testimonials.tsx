"use client";

import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import { useLanguage } from "@/components/providers";
import { testimonialsSection } from "@/lib/config";
import type { Testimonial } from "@/types";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Testimonials({ items }: { items: Testimonial[] }) {
  const { t, lang } = useLanguage();

  if (items.length === 0) return null;

  return (
    <section id="testimonials" className="px-6 py-16 md:px-10 md:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          kicker={testimonialsSection.kicker}
          heading={testimonialsSection.heading}
          index="06"
        />

        <Reveal className="mb-12 max-w-2xl text-gray-400">
          {t(testimonialsSection.description)}
        </Reveal>

        <div className="grid gap-6 md:grid-cols-2">
          {items.map((item, i) => {
            const quote = lang === "en" ? item.quote_en : item.quote_id || item.quote_en;
            const meta = [item.role, item.company].filter(Boolean).join(", ");

            return (
              <Reveal key={item.id} delay={i * 70}>
                <figure className="flex h-full flex-col justify-between border border-white/10 p-6 transition-colors duration-300 hover:border-accent/40 sm:p-7">
                  <span
                    aria-hidden="true"
                    className="text-display mb-4 block text-4xl leading-none text-accent/40"
                  >
                    &ldquo;
                  </span>

                  <blockquote className="text-base leading-relaxed text-gray-300">
                    {quote}
                  </blockquote>

                  <figcaption className="mt-6 flex items-center gap-3 border-t border-white/5 pt-5">
                    {item.avatar_url ? (
                       
                      <img
                        src={item.avatar_url}
                        alt={item.author}
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="text-display flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/20 text-sm text-accent"
                      >
                        {initialsOf(item.author)}
                      </span>
                    )}
                    <div className="min-w-0">
                      {item.link ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          className="block truncate text-sm font-semibold text-white transition-colors hover:text-accent"
                        >
                          {item.author}
                        </a>
                      ) : (
                        <p className="truncate text-sm font-semibold text-white">
                          {item.author}
                        </p>
                      )}
                      {meta && (
                        <p className="truncate text-xs text-gray-500">{meta}</p>
                      )}
                    </div>
                  </figcaption>
                </figure>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
