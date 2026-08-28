"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import MobileCarousel from "@/components/MobileCarousel";
import Tilt3D from "@/components/Tilt3D";
import { useLanguage } from "@/components/providers";
import { gallery } from "@/lib/config";
import type { GalleryPhoto } from "@/types";

export default function Gallery({
  items,
  embedded = false,
}: {
  items: GalleryPhoto[];
  embedded?: boolean;
}) {
  const { t, lang } = useLanguage();
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [slide, setSlide] = useState(0);
  const [deskPage, setDeskPage] = useState(0);
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = lightbox !== null ? "hidden" : "";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(orientation: landscape)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsLandscape(e.matches);
    handler(mql);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  async function rotateToLandscape() {
    try {
      const orientation = screen.orientation as ScreenOrientation & {
        lock?: (o: "landscape") => Promise<void>;
      };
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      if (orientation?.lock) {
        await orientation.lock("landscape");
      }
    } catch {
      // iOS Safari blocks programmatic rotation — device auto-rotate only.
    }
  }

  async function rotateToPortrait() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      screen.orientation?.unlock?.();
    } catch {
      // ignore
    }
  }

  function closeLightbox() {
    setLightbox(null);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    screen.orientation?.unlock?.();
  }

  const photoCard = (photo: GalleryPhoto, i: number) => {
    const title =
      lang === "en"
        ? photo.title_en ?? ""
        : photo.title_id ?? photo.title_en ?? "";
    return (
      <Tilt3D className="h-full">
        <button
          onClick={() => setLightbox(i)}
          className="group relative block aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10 transition-colors hover:border-accent/50"
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
      </Tilt3D>
    );
  };

  const body = (
    <>
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
            <div className="md:hidden">
              {(() => {
                const idx = Math.min(slide, items.length - 1);
                const total = items.length;
                return (
                  <MobileCarousel
                    total={total}
                    idx={idx}
                    onSlide={setSlide}
                    revealClassName="aspect-[4/3] w-full"
                  >
                    {photoCard(items[idx], idx)}
                  </MobileCarousel>
                );
              })()}
            </div>

            <div className="hidden md:block">
              {(() => {
                const pages = chunk(items, 3);
                const idx = Math.min(deskPage, pages.length - 1);
                const start = idx * 3;
                return (
                  <MobileCarousel
                    total={pages.length}
                    idx={idx}
                    onSlide={setDeskPage}
                    revealClassName="h-auto"
                  >
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {pages[idx].map((photo, i) => (
                        <Reveal key={photo.id} delay={i * 60} className="break-inside-avoid">
                          {photoCard(photo, start + i)}
                        </Reveal>
                      ))}
                    </div>
                  </MobileCarousel>
                );
              })()}
            </div>
          </>
        )}
    </>
  );

  const modal =
    lightbox !== null &&
    items[lightbox] &&
    createPortal(
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black p-6"
            onClick={closeLightbox}
          >
            <button
              className="absolute right-4 top-4 z-10 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-[#ffffff]/20 bg-black/50 text-[#ffffff] backdrop-blur-sm transition-colors hover:border-accent hover:text-accent sm:right-6 sm:top-6"
              onClick={closeLightbox}
              aria-label="Close"
            >
              ✕
            </button>

            {isLandscape && (
              <button
                className="absolute right-4 top-16 z-10 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-[#ffffff]/20 bg-black/50 text-[#ffffff] backdrop-blur-sm transition-colors hover:border-accent hover:text-accent md:hidden"
                onClick={(e) => {
                  e.stopPropagation();
                  rotateToPortrait();
                }}
                aria-label="Portrait mode"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="5" y="2" width="14" height="20" rx="2" />
                  <line x1="12" y1="18" x2="12" y2="18" />
                </svg>
              </button>
            )}

            <div className="flex flex-col items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={items[lightbox].image_url}
                alt={items[lightbox].title_en ?? "Photo"}
                className="max-h-[85vh] max-w-full rounded-xl object-contain"
                onClick={(e) => e.stopPropagation()}
              />

              <button
                className="flex items-center gap-2 rounded-full border border-[#ffffff]/20 bg-black/50 px-5 py-2 text-sm text-[#ffffff] backdrop-blur-sm transition-colors hover:border-accent hover:text-accent md:hidden"
                onClick={(e) => {
                  e.stopPropagation();
                  rotateToLandscape();
                }}
                aria-label="Rotate to landscape"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  <path d="M21 3v5h-5" />
                </svg>
                Landscape
              </button>
            </div>
          </div>,
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
    <section className="px-6 py-16 md:px-10 md:py-32">
      <div className="mx-auto max-w-7xl">
        <SectionHeading kicker={gallery.kicker} heading={gallery.heading} index="07" />
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