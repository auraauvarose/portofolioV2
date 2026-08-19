"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import { useLanguage } from "@/components/providers";
import { gallery } from "@/lib/config";
import type { GalleryPhoto } from "@/types";

export default function Gallery({ items }: { items: GalleryPhoto[] }) {
  const { t, lang } = useLanguage();
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (lightbox === null) return;
      if (e.key === "ArrowRight") setLightbox((lightbox + 1) % items.length);
      if (e.key === "ArrowLeft")
        setLightbox((lightbox - 1 + items.length) % items.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, items.length]);

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
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
            {items.map((photo, i) => {
              const title =
                lang === "en"
                  ? photo.title_en ?? ""
                  : photo.title_id ?? photo.title_en ?? "";
              return (
                <Reveal key={photo.id} delay={(i % 3) * 60} className="mb-4 break-inside-avoid">
                  <button
                    onClick={() => setLightbox(i)}
                    className="group relative block w-full overflow-hidden rounded-2xl border border-white/10 transition-colors hover:border-accent/50"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.image_url}
                      alt={title || `Photo ${i + 1}`}
                      className="w-full object-cover transition-transform duration-700 group-hover:scale-105"
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
                </Reveal>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox !== null && items[lightbox] && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-6 backdrop-blur-sm"
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
      )}
    </section>
  );
}
