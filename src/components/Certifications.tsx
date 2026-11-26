"use client";

import { useEffect, useRef, useState } from "react";
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
/** Ambang tahan sebelum gelembung peek muncul (iOS context menu ≈ 350–500ms). */
const PEEK_HOLD_MS = 380;

export default function Certifications({
  items,
}: {
  items: Certification[];
}) {
  const { t } = useLanguage();
  const [active, setActive] = useState<string>("all");
  const [selected, setSelected] = useState<Certification | null>(null);
  const [mobileDetails, setMobileDetails] = useState<string | null>(null);
  const [slide, setSlide] = useState(0);
  const [deskPage, setDeskPage] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  // "Peek" ala iOS: tahan kursor ~380ms → kartu mengambang sebagai gelembung
  // besar yang ikut kursor (dan bisa digeser di HP), lepas = hilang.
  const [peek, setPeek] = useState<{ cert: Certification; x: number; y: number } | null>(null);
  const holdRef = useRef<{ pointerId: number; timer: number; x: number; y: number } | null>(null);
  const peekRef = useRef(false);
  const stopPeekRef = useRef<(() => void) | null>(null);
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
    setMobileDetails(null);
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

  useEffect(() => () => stopPeekRef.current?.(), []);

  const startPeek = (cert: Certification, e: React.PointerEvent<HTMLElement>) => {
    if (!cert.image_url) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    // Tombol/tautan di dalam kartu tetap jalan normal.
    if ((e.target as HTMLElement).closest("a, button")) return;
    stopPeekRef.current?.();

    const pointerId = e.pointerId;
    const x0 = e.clientX;
    const y0 = e.clientY;
    const timer = window.setTimeout(() => {
      peekRef.current = true;
      setPeek({ cert, x: x0, y: y0 });
    }, PEEK_HOLD_MS);
    holdRef.current = { pointerId, timer, x: x0, y: y0 };

    const stop = () => {
      window.clearTimeout(timer);
      holdRef.current = null;
      stopPeekRef.current = null;
      setPeek(null);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    const onMove = (ev: PointerEvent) => {
      const h = holdRef.current;
      if (!h || ev.pointerId !== h.pointerId) return;
      if (!peekRef.current) {
        // Geser sebelum ambang tahan = niatnya scroll/swipe, bukan peek.
        if (Math.hypot(ev.clientX - h.x, ev.clientY - h.y) > 10) stop();
        return;
      }
      setPeek((p) => (p ? { ...p, x: ev.clientX, y: ev.clientY } : p));
    };
    const onUp = (ev: PointerEvent) => {
      if (holdRef.current && ev.pointerId !== holdRef.current.pointerId) return;
      stop();
      // Klik yang menyusul setelah peek diabaikan; kalau tidak ada klik,
      // flag dibersihkan sendiri.
      window.setTimeout(() => {
        peekRef.current = false;
      }, 350);
    };
    stopPeekRef.current = stop;
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  const filtered =
    active === "all" ? items : items.filter((c) => c.category === active);

  const activateCert = (cert: Certification) => {
    if (!cert.image_url) return;
    if (window.matchMedia("(max-width: 767px)").matches) {
      setMobileDetails((id) => (id === cert.id ? null : cert.id));
      return;
    }
    setSelected(cert);
  };

  const certCard = (cert: Certification) => (
    <Tilt3D className="h-full" max={10} scale={1.035} lift={18} glare>
      <article
        role={cert.image_url ? "button" : undefined}
        tabIndex={cert.image_url ? 0 : undefined}
        aria-haspopup={cert.image_url ? "dialog" : undefined}
        onPointerDown={(e) => startPeek(cert, e)}
        onContextMenu={(e) => {
          // Tahan-lama di HP jangan memunculkan menu konteks/salin gambar.
          if (cert.image_url) e.preventDefault();
        }}
        onClick={() => {
          if (peekRef.current) {
            peekRef.current = false;
            return;
          }
          activateCert(cert);
        }}
        onKeyDown={(e) => {
          if (!cert.image_url || e.target !== e.currentTarget) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            activateCert(cert);
          }
        }}
        className={`group liquid-glass relative flex h-full min-h-[16rem] select-none flex-col overflow-hidden rounded-2xl transition-[border-color] duration-300 outline-none [-webkit-touch-callout:none] hover:border-accent/40 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink md:min-h-[17rem] ${cert.image_url ? "cursor-pointer" : ""}`}
      >
        <div
          className={`tilt-layer flex flex-1 flex-col p-5 md:p-7 ${cert.image_url && mobileDetails !== cert.id ? "max-md:invisible" : ""}`}
          style={{ "--tz": "52px" } as React.CSSProperties}
        >
          <div className="flex items-baseline justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-accent">
              <span aria-hidden className="h-1 w-1 rounded-full bg-accent" />
              {t(certifications.categories[cert.category] ?? {
                en: cert.category,
                id: cert.category,
              })}
            </span>
            {cert.date && (
              <span className="shrink-0 font-mono text-xs tracking-wide text-khaki">
                {cert.date}
              </span>
            )}
          </div>
          <h3 className="mt-3 text-lg font-semibold leading-snug text-white md:text-2xl">
            {lang_title(cert, t)}
          </h3>
          {cert.description_en && (
            <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-gray-400">
              {t({
                en: cert.description_en,
                id: cert.description_id ?? cert.description_en,
              })}
            </p>
          )}
          <div className="mt-auto border-t border-white/10 flex items-center justify-between gap-3 pt-3">
            <span className="truncate text-xs uppercase tracking-widest text-gray-500">
              {cert.issuer
                ? `${t({ en: "By", id: "Oleh" })} ${cert.issuer}`
                : t({ en: "Credential", id: "Kredensial" })}
            </span>
            {cert.image_url && (
              <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-accent">
                {unlocked
                  ? t({ en: "Open scan", id: "Buka scan" })
                  : t({ en: "Locked", id: "Terkunci" })}
                <span aria-hidden>↗</span>
              </span>
            )}
          </div>
          {cert.image_url && mobileDetails === cert.id && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelected(cert);
              }}
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-5 text-xs font-medium uppercase tracking-widest text-black md:hidden"
            >
              {t({ en: "View certificate", id: "Lihat sertifikat" })}
            </button>
          )}
        </div>

        {/* Di HP gambar tampil dulu; ketukan kartu menukar ke detail teks. */}
        {cert.image_url && (
          <div
            className={`tilt-layer absolute inset-0 z-10 flex items-center justify-center bg-black/70 opacity-0 transition-opacity duration-300 md:group-hover:opacity-100 md:group-focus-visible:opacity-100 motion-reduce:transition-none max-md:bg-transparent ${mobileDetails === cert.id ? "max-md:pointer-events-none max-md:opacity-0" : "max-md:opacity-100"}`}
            style={peek?.cert.id === cert.id ? { opacity: 0 } : undefined}
          >
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
              <span className="liquid-glass-chip relative z-20 inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-xs font-medium uppercase tracking-widest text-white max-md:hidden">
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
          align="center"
        />

        <Reveal className="mb-8 max-w-2xl text-gray-400">
          {t(certifications.description)}
        </Reveal>

        <Reveal className="mb-10">
          <div className="glass-segmented liquid-glass grid max-w-full grid-cols-2 items-center gap-1 rounded-3xl p-1 sm:inline-flex sm:w-auto sm:flex-wrap sm:rounded-full">
            {[
              { key: "all", label: t({ en: "All", id: "Semua" }) },
              ...CATEGORY_ORDER.map((cat) => ({
                key: cat,
                label: t(certifications.categories[cat]),
              })),
            ].map((item) => {
              const on = active === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActive(item.key)}
                  aria-pressed={on}
                  className={`glass-segment relative z-10 cursor-pointer rounded-2xl px-5 py-2 text-sm uppercase tracking-widest transition-colors max-md:min-h-11 sm:rounded-full ${
                    on
                      ? "text-white"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
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
                      glassNav
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
                      onSlide={(i) => {
                        setSlide(i);
                        setMobileDetails(null);
                      }}
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

      {peek &&
        createPortal(
          <div className="pointer-events-none fixed inset-0 z-[105] select-none">
            <div
              className="absolute w-[26rem] max-w-[86vw]"
              style={{
                // Mengambang di atas kursor/jari supaya kartunya tetap kelihatan,
                // dijepit agar tidak keluar layar (setengah lebar + tinggi 108%
                // ikut dihitung karena transform -50%/-108%).
                left: clampPeekX(peek.x),
                top: Math.max(peek.y, 264),
                transform: "translate(-50%,-108%)",
              }}
            >
              <div className="peek-bubble overflow-hidden rounded-[1.5rem] border border-white/20 bg-[#0d0e13]/95 shadow-[0_24px_70px_-24px_rgba(0,0,0,0.85)] backdrop-blur-xl">
                <div className="relative aspect-[3/2] w-full bg-black/40">
                  {peek.cert.image_url && (
                    <img
                      src={peek.cert.image_url}
                      alt=""
                      aria-hidden="true"
                      draggable={false}
                      className={`h-full w-full scale-105 object-cover ${unlocked ? "" : "blur-lg brightness-[0.5]"}`}
                    />
                  )}
                  {!unlocked && (
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#0d0e13]/65"
                      style={{ color: "#f4f4f5" }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        className="h-7 w-7 text-accent"
                      >
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <span className="text-xs uppercase tracking-widest">
                        {t({ en: "Request permission", id: "Minta izin" })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

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
            className="absolute right-4 top-4 z-20 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full liquid-glass-chip text-[#ffffff] transition-colors hover:border-accent hover:text-accent sm:right-6 sm:top-6"
          >
            ✕
          </button>
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl liquid-glass liquid-glass--strong"
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

/** Jaga gelembung peek tetap di dalam layar setelah translate(-50%). */
function clampPeekX(x: number) {
  const half = Math.min(208, window.innerWidth * 0.43);
  return Math.min(Math.max(x, half), window.innerWidth - half);
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
