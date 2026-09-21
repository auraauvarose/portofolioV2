"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import CustomCursor from "@/components/CustomCursor";
import SpiderWalker from "@/components/SpiderWalker";
import ScrollProgress from "@/components/ScrollProgress";
import SmoothScroll from "@/components/SmoothScroll";
import PageControls from "@/components/PageControls";
import { motion, useReducedMotion } from "motion/react";
import { EASE_EXPO } from "@/lib/motion";
import { useLanguage } from "@/components/providers";
import { comments } from "@/lib/config";
import type { GuestComment } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function relativeTime(iso: string, justNowLabel: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  if (diff < 45_000) return justNowLabel;
  const min = Math.floor(diff / 60_000);
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Warna avatar deterministik dari nama — palet senada dengan tema.
const AVATAR_HUES = [16, 32, 205, 258, 150, 340];
function avatarHue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (Math.imul(31, h) + name.charCodeAt(i)) | 0;
  return AVATAR_HUES[Math.abs(h) % AVATAR_HUES.length];
}

function StarRow({ value, small = false }: { value: number; small?: boolean }) {
  const size = small ? 12 : 16;
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value}/5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={i < value ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.6"
          className={i < value ? "text-accent" : "text-gray-600"}
          aria-hidden="true"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Kartu komentar
// ---------------------------------------------------------------------------

function CommentCard({ c, index, justNowLabel }: { c: GuestComment; index: number; justNowLabel: string }) {
  const hue = avatarHue(c.name);
  return (
    <Reveal
      delay={Math.min(index, 8) * 70}
      variant={index % 2 === 0 ? "left" : "right"}
      className="h-full"
    >
      {/* Kartu murah: hover hanya border-color (paint kecil), bukan glow
          radial yang harus di-raster ulang tiap pointermove. */}
      <article className="glass flex h-full flex-col gap-4 rounded-2xl border border-white/10 p-6 transition-[border-color,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-accent/50 hover:-translate-y-1">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-display text-sm text-black"
                style={{
                  backgroundColor: `hsl(${hue} 62% 62%)`,
                }}
              >
                {initialsOf(c.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">{c.name}</p>
                <p className="text-xs uppercase tracking-widest text-gray-500">
                  {relativeTime(c.created_at, justNowLabel)}
                </p>
              </div>
            </div>
            {typeof c.rating === "number" && <StarRow value={c.rating} small />}
          </div>
          <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-ecru">
            {c.message}
          </p>
        </article>
    </Reveal>
  );
}

// ---------------------------------------------------------------------------
// Halaman komentar
// ---------------------------------------------------------------------------

export default function CommentsClient({ initial }: { initial: GuestComment[] }) {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);

  // Daftar komentar tidak pernah diubah di klien: komentar baru berstatus
  // pending (menunggu moderasi) sehingga tidak langsung ditambahkan.
  const items = initial;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  // Honeypot — field tersembunyi; bot yang mengisinya diabaikan server.
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Pause loop warna badge saat section di luar layar (pola yang sama
  // dengan section Contact).
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => el.classList.toggle("cycle-halt", !entry?.isIntersecting),
      { rootMargin: "160px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, rating, website }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(data?.error ?? t(comments.errorGeneric));
        setStatus("error");
        return;
      }
      // Komentar baru berstatus pending (belum tayang), jadi JANGAN
      // ditambahkan ke daftar publik — kalau ditambahkan, pengunjung melihat
      // komentarnya sendiri seolah sudah tayang padahal masih moderasi.
      setStatus("ok");
      setName("");
      setEmail("");
      setMessage("");
      setRating(null);
      window.setTimeout(() => setStatus("idle"), 4000);
    } catch {
      setErrorMsg(t(comments.errorGeneric));
      setStatus("error");
    }
  }

  const maxChars = 1000;

  return (
    <SmoothScroll>
      <main className="relative min-h-screen overflow-x-clip bg-ink">
        <CustomCursor />
        <SpiderWalker />
        <ScrollProgress />
        {/* Menu kontrol (tema + musik) — fixed di atas, center, sama di mobile. */}
        <PageControls />
        {/* tv-static (grain full-viewport) sengaja tidak dipakai di halaman
            ini — repaint viewport tiap 0.5s adalah sumber lag di GPU lemah. */}

        <section
          id="comments"
          ref={sectionRef}
          className="comments-stage relative overflow-hidden px-6 py-16 md:px-10 md:py-32"
        >
          {/* Latar minimalis: hanya warna flat + hairline — tanpa blur/orb/
              animasi latar agar scrolling tetap ringan di perangkat lemah. */}
          <div className="comments-stage__frame relative mx-auto max-w-7xl">
            <SectionHeading
              index={comments.index}
              kicker={comments.kicker}
              heading={comments.heading}
            />

            <Reveal variant="left" className="-mt-6 mb-12 md:mb-16">
              <p className="max-w-2xl text-lg leading-relaxed text-gray-400">
                {t(comments.description)}
              </p>
            </Reveal>

            {/* Badge "open for notes" — pola identik dengan badge Contact */}
            <Reveal className="mb-12">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#22c55e]/30 bg-[#22c55e]/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-[#22c55e] animate-color-cycle-ink">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75 [animation:ping-soft_1.6s_ease-out_infinite,color-cycle_8s_linear_infinite]" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22c55e] animate-color-cycle" />
                </span>
                {items.length} {t(comments.count)}
              </div>
            </Reveal>

            {/* ── Form komentar ── */}
            <Reveal variant="zoom" className="mb-16 md:mb-20">
              <form
                onSubmit={onSubmit}
                className="glass rounded-3xl p-6 md:p-10"
                noValidate
              >
                  {/* Honeypot — tersembunyi dari manusia */}
                  <div className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
                    <label>
                      Website
                      <input
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                      />
                    </label>
                  </div>

                  <h3 className="text-display text-2xl uppercase text-white md:text-3xl">
                    {t(comments.formTitle)}
                  </h3>

                  <div className="mt-6 grid gap-5 md:grid-cols-2">
                    <div>
                      <label htmlFor="c-name" className="mb-2 block text-xs uppercase tracking-widest text-gray-500">
                        {t(comments.nameLabel)}
                      </label>
                      <input
                        id="c-name"
                        type="text"
                        required
                        maxLength={60}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t(comments.namePlaceholder)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-600 outline-none transition-colors duration-300 focus:border-accent"
                      />
                    </div>
                    <div>
                      <label htmlFor="c-email" className="mb-2 block text-xs uppercase tracking-widest text-gray-500">
                        {t(comments.emailLabel)}
                      </label>
                      <input
                        id="c-email"
                        type="email"
                        maxLength={120}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t(comments.emailPlaceholder)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-600 outline-none transition-colors duration-300 focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="mt-5">
                    <label htmlFor="c-message" className="mb-2 block text-xs uppercase tracking-widest text-gray-500">
                      {t(comments.messageLabel)}
                    </label>
                    <textarea
                      id="c-message"
                      required
                      rows={5}
                      maxLength={maxChars}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={t(comments.messagePlaceholder)}
                      className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-600 outline-none transition-colors duration-300 focus:border-accent"
                    />
                    <p className="mt-1 text-right text-xs text-gray-600">
                      {message.length}/{maxChars}
                    </p>
                  </div>

                  {/* Rating bintang */}
                  <div className="mt-2">
                    <p className="mb-2 text-xs uppercase tracking-widest text-gray-500">
                      {t(comments.ratingLabel)}
                    </p>
                    <div className="flex items-center gap-1.5" onMouseLeave={() => setHoverRating(null)}>
                      {Array.from({ length: 5 }, (_, i) => i + 1).map((v) => {
                        const active = (hoverRating ?? rating ?? 0) >= v;
                        return (
                          <button
                            key={v}
                            type="button"
                            aria-label={`${v}/5`}
                            onMouseEnter={() => setHoverRating(v)}
                            onClick={() => setRating(rating === v ? null : v)}
                            className="touch-active p-0.5 transition-transform duration-200 hover:scale-110 active:scale-90"
                          >
                            <svg
                              width="26"
                              height="26"
                              viewBox="0 0 24 24"
                              fill={active ? "currentColor" : "none"}
                              stroke="currentColor"
                              strokeWidth="1.6"
                              className={`transition-colors duration-200 ${active ? "text-accent" : "text-gray-600 hover:text-accent"}`}
                              aria-hidden="true"
                            >
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-8 flex flex-wrap items-center gap-4">
                    <button
                      type="submit"
                      disabled={status === "sending"}
                      className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-accent px-8 py-3.5 text-sm font-bold uppercase tracking-widest text-black transition-all duration-300 hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {status === "sending" ? t(comments.sending) : t(comments.submit)}
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className="transition-transform duration-300 group-hover:translate-x-1"
                        aria-hidden="true"
                      >
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </button>

                    {status === "ok" && (
                      <motion.p
                        initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: EASE_EXPO }}
                        className="text-sm font-medium text-[#22c55e]"
                        role="status"
                      >
                        ✓ {t(comments.success)}
                      </motion.p>
                    )}
                    {status === "error" && (
                      <motion.p
                        initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: EASE_EXPO }}
                        className="text-sm font-medium text-red-400"
                        role="alert"
                      >
                        {errorMsg || t(comments.errorGeneric)}
                      </motion.p>
                    )}
                  </div>
                </form>
              </Reveal>

            {/* ── Daftar komentar ── */}
            {items.length === 0 ? (
              <Reveal>
                <div className="glass rounded-2xl p-12 text-center">
                  <p className="text-serif-accent text-2xl text-accent">“</p>
                  <p className="mt-2 text-lg text-gray-400">{t(comments.empty)}</p>
                </div>
              </Reveal>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {items.map((c, i) => (
                  <CommentCard key={c.id} c={c} index={i} justNowLabel={t(comments.justNow)} />
                ))}
              </div>
            )}

            {/* ── Tombol kembali ke beranda ── */}
            <Reveal className="mt-20 flex justify-center">
              <Link
                href="/"
                className="group relative inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-8 py-3.5 text-sm font-bold uppercase tracking-widest text-white transition-colors duration-300 hover:border-accent hover:text-accent"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="transition-transform duration-300 group-hover:-translate-x-1"
                  aria-hidden="true"
                >
                  <path d="M19 12H5M11 18l-6-6 6-6" />
                </svg>
                {t(comments.backHome)}
              </Link>
            </Reveal>
          </div>
        </section>
      </main>
    </SmoothScroll>
  );
}

