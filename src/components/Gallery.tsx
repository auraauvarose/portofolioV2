"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import MobileCarousel from "@/components/MobileCarousel";
import Tilt3D from "@/components/Tilt3D";
import { useLanguage } from "@/components/providers";
import { useIsDesktop } from "@/lib/use-media-query";
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
  const isDesktop = useIsDesktop();
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [slide, setSlide] = useState(0);
  const [deskPage, setDeskPage] = useState(0);
  const [isLandscape, setIsLandscape] = useState(false);
  const [active, setActive] = useState<string>("all");

  // Kategori yang benar-benar dipakai data — bukan daftar statis.
  const categories = useMemo(() => {
    const set = new Set(items.map((p) => p.category).filter(Boolean));
    return [...set];
  }, [items]);

  const filtered = useMemo(
    () => (active === "all" ? items : items.filter((p) => p.category === active)),
    [items, active],
  );

  // Dibaca oleh handler keyboard tanpa ikut jadi dependency effect.
  const filteredRef = useRef(filtered);
  useEffect(() => {
    filteredRef.current = filtered;
  }, [filtered]);

  // Kategori bisa hilang setelah admin menghapus foto — kembalikan ke "all"
  // supaya daftar tidak diam-diam kosong.
  useEffect(() => {
    if (active !== "all" && !categories.includes(active)) setActive("all");
  }, [active, categories]);

  // Navigasi lightbox: Escape menutup, panah kiri/kanan berpindah foto.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (lightbox === null) return;

      if (e.key === "Escape") {
        closeLightbox();
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const step = e.key === "ArrowLeft" ? -1 : 1;
        setLightbox((cur) => {
          if (cur === null) return cur;
          const total = filteredRef.current.length;
          if (total === 0) return cur;
          // Memutar (wrap) supaya tidak pernah mentok di ujung.
          return (cur + step + total) % total;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = lightbox !== null ? "hidden" : "";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox]);

  useEffect(() => {
    setSlide(0);
    setDeskPage(0);
    // Indeks lightbox mengacu ke daftar hasil filter, jadi harus ditutup
    // saat filter berubah agar tidak menampilkan foto yang berbeda.
    setLightbox(null);
  }, [active]);

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
      <Tilt3D className="h-full" max={10} scale={1.035} lift={18} glare>
        <button
          onClick={() => setLightbox(i)}
          className="group relative block aspect-[4/3] w-full cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-black/40 transition-[border-color,box-shadow] duration-300 hover:border-accent/50 hover:shadow-[0_28px_60px_-26px_rgba(235,89,57,0.4)] focus-visible:border-accent focus-visible:outline-none"
          aria-label={title || `Photo ${i + 1}`}
        >
          <div
            className="tilt-layer relative h-full w-full"
            style={{ "--tz": "40px" } as React.CSSProperties}
          >
            { }
            <img
              src={photo.image_url}
              alt={photo.alt_text || title || `Photo ${i + 1}`}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-transparent to-transparent">
              {title && (
                <p
                  className="tilt-layer p-5 text-left text-sm font-medium text-[#ffffff]"
                  style={{ "--tz": "60px" } as React.CSSProperties}
                >
                  {title}
                </p>
              )}
            </div>
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

        {/* Filter kategori — hanya muncul kalau ada lebih dari satu kategori */}
        {categories.length > 1 && (
          <Reveal className="mb-8 flex flex-wrap items-center gap-2">
            {["all", ...categories].map((cat) => {
              const isActive = active === cat;
              const label =
                cat === "all"
                  ? t(gallery.allLabel)
                  : t(gallery.categoryLabels[cat]) || cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActive(cat)}
                  aria-pressed={isActive}
                  className={`rounded-full px-4 py-2 text-xs uppercase tracking-widest transition-colors duration-300 ${
                    isActive
                      ? "bg-accent text-black"
                      : "border border-white/15 text-gray-300 hover:border-accent hover:text-accent"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </Reveal>
        )}

        {filtered.length === 0 ? (
          <Reveal>
            <p className="rounded-2xl border border-white/10 bg-panel p-10 text-center text-gray-500">
              {active === "all"
                ? t({
                    en: "No photos yet — check back soon.",
                    id: "Belum ada foto — nantikan segera.",
                  })
                : t(gallery.emptyFiltered)}
            </p>
          </Reveal>
        ) : (
          <>
            {/* Mount only the active breakpoint's tree (see Projects). */}
            {isDesktop ? (
              <div className="hidden md:block">
                {(() => {
                  const pages = chunk(filtered, 3);
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
                          <Reveal key={photo.id} delay={i * 60} media className="break-inside-avoid">
                            {photoCard(photo, start + i)}
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
                  const total = filtered.length;
                  return (
                    <MobileCarousel
                      total={total}
                      idx={idx}
                      onSlide={setSlide}
                      revealClassName="aspect-[4/3] w-full"
                    >
                      {photoCard(filtered[idx], idx)}
                    </MobileCarousel>
                  );
                })()}
              </div>
            )}
          </>
        )}
    </>
  );

  const modal =
    lightbox !== null &&
    filtered[lightbox] &&
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

            {/* Panah navigasi — hanya bila ada lebih dari satu foto */}
            {filtered.length > 1 && (
              <>
                <button
                  className="absolute left-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[#ffffff]/20 bg-black/50 text-[#ffffff] backdrop-blur-sm transition-colors hover:border-accent hover:text-accent sm:left-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightbox((cur) =>
                      cur === null
                        ? cur
                        : (cur - 1 + filtered.length) % filtered.length,
                    );
                  }}
                  aria-label="Foto sebelumnya"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <button
                  className="absolute right-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[#ffffff]/20 bg-black/50 text-[#ffffff] backdrop-blur-sm transition-colors hover:border-accent hover:text-accent sm:right-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightbox((cur) =>
                      cur === null ? cur : (cur + 1) % filtered.length,
                    );
                  }}
                  aria-label="Foto berikutnya"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </>
            )}

            <div className="flex flex-col items-center gap-4">
              { }
              <img
                src={filtered[lightbox].image_url}
                alt={
                  filtered[lightbox].alt_text ||
                  filtered[lightbox].title_en ||
                  "Photo"
                }
                className="max-h-[85vh] max-w-full rounded-xl object-contain"
                decoding="async"
                onClick={(e) => e.stopPropagation()}
              />

              {/* Penghitung posisi + petunjuk navigasi keyboard */}
              <div
                className="flex items-center gap-3 text-xs text-[#ffffff]/70"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="rounded-full border border-[#ffffff]/20 bg-black/50 px-3 py-1 backdrop-blur-sm">
                  {lightbox + 1} / {filtered.length}
                </span>
                {filtered.length > 1 && (
                  <span className="hidden sm:inline">
                    ← → untuk berpindah · Esc untuk menutup
                  </span>
                )}
              </div>

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