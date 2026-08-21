"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import { useLanguage } from "@/components/providers";
import { gallery } from "@/lib/config";
import type { GalleryPhoto } from "@/types";

export default function Gallery({ items }: { items: GalleryPhoto[] }) {
  const { t, lang } = useLanguage();
  const [lightbox, setLightbox] = useState<number | null>(null);
  // Mobile carousel: which photo is shown as the big card.
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (lightbox === null) return;
      if (e.key === "ArrowRight") setLightbox((lightbox + 1) % items.length);
      if (e.key === "ArrowLeft")
        setLightbox((lightbox - 1 + items.length) % items.length);
    };
    window.addEventListener("keydown", onKey);
    // Lock body scroll while the lightbox is open.
    document.body.style.overflow = lightbox !== null ? "hidden" : "";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, items.length]);

  // Single photo renderer shared by the mobile slide scroller and the
  // desktop masonry so both stay in sync.
  const photoCard = (photo: GalleryPhoto, i: number) => {
    const title =
      lang === "en"
        ? photo.title_en ?? ""
        : photo.title_id ?? photo.title_en ?? "";
    return (
      <button
        onClick={() => setLightbox(i)}
        className="group relative block w-full overflow-hidden rounded-2xl border border-white/10 transition-colors hover:border-accent/50"
        aria-label={title || `Photo ${i + 1}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.image_url}
          alt={title || `Photo ${i + 1}`}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          {title && (
            <p className="p-5 text-left text-sm font-medium text-[#ffffff]">
              {title}
            </p>
          )}
        </div>
      </button>
    );
  };

  return (
    <section className="px-6 py-16 md:px-10 md:py-32">
      <div className="mx-auto max-w-7xl">
        <SectionHeading kicker={gallery.kicker} heading={gallery.heading} index="09" />

        <Reveal className="mb-10 max-w-2xl text-gray-400">
          {t(gallery.description)}
        </Reveal>

        {items.length === 0 ? (
          <Reveal>
            <p className="rounded-2xl border border-white/10 bg-panel p-10 text-center text-gray-500">
              {t({
                en: "No photos yet — check back soon.",
                id: "Belum ada foto — nantikan segera.",
              })}
            </p>
          </Reveal>
        ) : (
          <>
            {/* Mobile: one big photo at a time, with a dot slider below and a
                "n / total" counter on the left. */}
            <div className="md:hidden">
              {(() => {
                const idx = Math.min(slide, items.length - 1);
                const total = items.length;
                const go = (next: number) => setSlide((next + total) % total);
                return (
                  <div>
                    <div className="relative">
                      <Reveal className="aspect-[4/3] w-full">
                        {photoCard(items[idx], idx)}
                      </Reveal>
                      {total > 1 && (
                        <>
                          <button
                            type="button"
                            aria-label="Sebelumnya"
                            onClick={() => go(idx - 1)}
                            className="absolute -left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/60 text-white backdrop-blur transition-colors hover:border-accent hover:text-accent"
                          >
                            ‹
                          </button>
                          <button
                            type="button"
                            aria-label="Berikutnya"
                            onClick={() => go(idx + 1)}
                            className="absolute -right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/60 text-white backdrop-blur transition-colors hover:border-accent hover:text-accent"
                          >
                            ›
                          </button>
                        </>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs uppercase tracking-widest text-gray-500">
                        {String(idx + 1).padStart(2, "0")} /{" "}
                        {String(total).padStart(2, "0")}
                      </span>
                      <div className="flex items-center gap-2">
                        {total > 1 &&
                          items.map((_, i) => (
                            <button
                              key={i}
                              type="button"
                              aria-label={`Slide ${i + 1}`}
                              onClick={() => setSlide(i)}
                              className={`h-2 w-2 rounded-full transition-all ${
                                i === idx
                                  ? "w-6 bg-accent"
                                  : "bg-white/25 hover:bg-white/50"
                              }`}
                            />
                          ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Desktop: masonry columns */}
            <div className="hidden columns-1 gap-4 md:block sm:columns-2 lg:columns-3">
              {items.map((photo, i) => (
                <Reveal key={photo.id} delay={(i % 3) * 60} className="mb-4 break-inside-avoid">
                  {photoCard(photo, i)}
                </Reveal>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Lightbox — portaled to <body> so it escapes the ancestor `relative
          z-[1]` stacking context and truly paints ABOVE the nav (z-100),
          social rail (z-40) and tv-static (z-90). */}
      {lightbox !== null &&
        items[lightbox] &&
        createPortal(
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black p-6"
            onClick={() => setLightbox(null)}
          >
          <button
            className="absolute right-4 top-4 z-10 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-[#ffffff]/20 bg-black/50 text-[#ffffff] backdrop-blur-sm transition-colors hover:border-accent hover:text-accent sm:right-6 sm:top-6"
            onClick={() => setLightbox(null)}
            aria-label="Close"
          >
            ✕
          </button>
          <button
            className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[#ffffff]/20 bg-black/50 text-xl text-[#ffffff] backdrop-blur-sm transition-colors hover:border-accent hover:text-accent sm:left-4"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((lightbox - 1 + items.length) % items.length);
            }}
            aria-label="Previous image"
          >
            ←
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={items[lightbox].image_url}
            alt={items[lightbox].title_en ?? "Photo"}
            className="max-h-[85vh] max-w-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[#ffffff]/20 bg-black/50 text-xl text-[#ffffff] backdrop-blur-sm transition-colors hover:border-accent hover:text-accent sm:right-4"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((lightbox + 1) % items.length);
            }}
            aria-label="Next image"
          >
            →
          </button>
          </div>
          ,
          document.body
        )}
    </section>
  );
}
