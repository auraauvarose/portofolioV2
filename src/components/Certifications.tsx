"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import Tilt3D from "@/components/Tilt3D";
import MobileCarousel from "@/components/MobileCarousel";
import { useLanguage } from "@/components/providers";
import { useFocusTrap } from "@/lib/use-focus-trap";
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
  const [slide, setSlide] = useState(0);
  const [deskPage, setDeskPage] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const modalRef = useFocusTrap<HTMLDivElement>(selected !== null);

  // Izin disimpan di cookie perangkat ini. Dicek saat halaman dibuka dan saat
  // tab kembali aktif, jadi begitu admin menekan "Setuju" sertifikat terbuka
  // tanpa reload.
  useEffect(() => {
    let alive = true;
    const check = async () => {
      try {
        const res = await fetch("/api/certificate-request", {
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (alive && data?.status === "approved") setUnlocked(true);
      } catch {
        // offline / jaringan gagal → tetap terkunci
      }
    };
    void check();
    const onWake = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("focus", check);
    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("focus", check);
    };
  }, []);

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

  const filtered =
    active === "all" ? items : items.filter((c) => c.category === active);

  const certCard = (cert: Certification) => (
    <Tilt3D className="h-full" max={10} scale={1.035} lift={18} glare>
      <article
        role={cert.image_url ? "button" : undefined}
        tabIndex={cert.image_url ? 0 : undefined}
        aria-haspopup={cert.image_url ? "dialog" : undefined}
        onClick={() => cert.image_url && setSelected(cert)}
        onKeyDown={(e) => {
          if (!cert.image_url || e.target !== e.currentTarget) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setSelected(cert);
          }
        }}
        className={`group relative flex h-full min-h-[15rem] flex-col overflow-hidden rounded-2xl border border-white/10 bg-panel shadow-[0_18px_50px_-24px_rgba(0,0,0,0.6)] transition-[border-color,box-shadow] duration-300 outline-none hover:border-accent/40 hover:shadow-[0_30px_70px_-28px_rgba(235,89,57,0.35)] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink md:min-h-72 ${cert.image_url ? "cursor-pointer" : ""}`}
      >
        <div
          className="tilt-layer flex flex-1 flex-col p-5 md:p-6"
          style={{ "--tz": "52px" } as React.CSSProperties}
        >
          <div className="flex items-start justify-between gap-3">
            <span className="text-xs font-medium uppercase tracking-widest text-accent">
              {t(certifications.categories[cert.category] ?? {
                en: cert.category,
                id: cert.category,
              })}
            </span>
            {cert.date && (
              <span className="shrink-0 text-xs text-gray-500">{cert.date}</span>
            )}
          </div>
          <h3 className="mt-4 text-lg font-semibold leading-snug text-white md:text-xl">
            {lang_title(cert, t)}
          </h3>
          {cert.description_en && (
            <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-gray-400">
              {t({
                en: cert.description_en,
                id: cert.description_id ?? cert.description_en,
              })}
            </p>
          )}
          {cert.issuer && (
            <p className="mt-auto border-t border-white/10 pt-3 text-xs uppercase tracking-widest text-gray-500">
              {t({ en: "By:", id: "Oleh:" })} {cert.issuer}
            </p>
          )}
        </div>

        {/* Gambar sertifikat hanya muncul saat kartu disorot / difokus keyboard. */}
        {cert.image_url && (
          <div className="tilt-layer absolute inset-0 z-10 flex items-center justify-center bg-black/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none">
            { }
            <img
              src={cert.image_url}
              alt={cert.alt_text || cert.title_en}
              className={`absolute inset-0 h-full w-full scale-105 object-cover transition-[filter] duration-500 ${unlocked ? "" : "blur-lg"}`}
              loading="lazy"
              decoding="async"
            />
            {!unlocked && <LockOverlay />}
            {unlocked && (
              <span className="relative z-20 inline-flex min-h-11 items-center gap-2 rounded-full bg-black/70 px-5 text-xs font-medium uppercase tracking-widest text-white backdrop-blur-sm">
                {t({ en: "View certificate", id: "Lihat sertifikat" })}
                <span aria-hidden className="h-2 w-2 rounded-full bg-accent" />
              </span>
            )}
          </div>
        )}
      </article>
    </Tilt3D>
  );

  return (
    <section className="relative px-6 py-16 md:px-10 md:py-32">
      <div className="relative mx-auto max-w-[96rem]">
        <SectionHeading
          kicker={certifications.kicker}
          heading={certifications.heading}
          index="04"
          align="center"
        />

        <Reveal className="mb-8 max-w-2xl text-gray-400">
          {t(certifications.description)}
        </Reveal>

        <Reveal className="mb-10 flex flex-wrap gap-3">
          <button
            onClick={() => setActive("all")}
            className={`rounded-full px-5 py-2 text-sm uppercase tracking-widest transition-colors max-md:min-h-11 ${
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
              className={`rounded-full px-5 py-2 text-sm uppercase tracking-widest transition-colors max-md:min-h-11 ${
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
          <>
            <div className="hidden md:block">
                {(() => {
                  const pages = chunk(filtered, 3);
                  const idx = Math.min(deskPage, pages.length - 1);
                  return (
                    <MobileCarousel
                      total={pages.length}
                      idx={idx}
                      onSlide={setDeskPage}
                      revealClassName="h-auto"
                    >
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {pages[idx].map((cert, i) => (
                          <Reveal key={cert.id} delay={i * 80} media className="h-full">
                            {certCard(cert)}
                          </Reveal>
                        ))}
                      </div>
                    </MobileCarousel>
                  );
                })()}
            </div>

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
                      swipeOnly
                    >
                      {certCard(current)}
                    </MobileCarousel>
                  );
                })()}
            </div>
          </>
        )}
      </div>

      {selected &&
        createPortal(
          <div
            ref={modalRef}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black p-6"
            onClick={() => setSelected(null)}
            role="dialog"
            aria-modal="true"
            aria-label={lang_title(selected, t) || "Certification"}
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
            {selected.image_url && (
              <div className="relative flex w-full items-center justify-center overflow-hidden bg-black/40">
                { }
                <img
                  src={selected.image_url}
                  alt={selected.alt_text || selected.title_en || "Certification"}
                  className={`max-h-[80vh] w-auto max-w-full scale-105 object-contain transition-[filter] duration-500 ${unlocked ? "" : "blur-lg"}`}
                  decoding="async"
                />
                {!unlocked && <LockOverlay large />}
              </div>
            )}
          </div>
          </div>
          ,
          document.body
        )}
    </section>
  );
}

function lang_title(
  cert: Certification,
  t: (v: { en: string; id: string }) => string,
) {
  return t({ en: cert.title_en, id: cert.title_id });
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Gembok di atas foto sertifikat. Fotonya tetap di-blur karena sertifikat
 * memuat nama lengkap; pengunjung harus minta izin dulu lewat /izin-sertifikat.
 */
function LockOverlay({ large = false }: { large?: boolean }) {
  const { t } = useLanguage();
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-ink/60 px-4 text-center backdrop-blur-[2px]">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={large ? "h-10 w-10 text-accent" : "h-7 w-7 text-accent"}
      >
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      <p className={large ? "text-sm text-gray-200" : "text-xs text-gray-200 md:text-sm"}>
        {t({
          en: "Request permission to view",
          id: "Meminta izin untuk melihat",
        })}
      </p>
      <Link
        href="/izin-sertifikat"
        onClick={(e) => e.stopPropagation()}
        className={`inline-flex items-center justify-center rounded-full bg-accent font-medium uppercase tracking-widest text-black transition-colors hover:bg-accent-soft ${
          large ? "min-h-11 px-6 text-sm" : "min-h-9 px-4 text-xs"
        }`}
      >
        {t({ en: "Permission", id: "Izin" })}
      </Link>
    </div>
  );
}
