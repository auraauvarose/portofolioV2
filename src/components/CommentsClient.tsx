"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import SectionHeading from "@/components/SectionHeading";
import CustomCursor from "@/components/CustomCursor";
import SpiderWalker from "@/components/SpiderWalker";
import ScrollProgress from "@/components/ScrollProgress";
import SmoothScroll from "@/components/SmoothScroll";
import PageControls from "@/components/PageControls";
import { useLanguage } from "@/components/providers";
import { comments } from "@/lib/config";
import type { GuestComment } from "@/types";

const STAR_PATH =
  "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";

function Star({ filled, size = 14 }: { filled: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden="true"
      className={filled ? "text-accent" : "text-gray-600 dark:text-gray-400"}
    >
      <path d={STAR_PATH} />
    </svg>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value}/5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} filled={i < value} size={12} />
      ))}
    </span>
  );
}

function formatDate(iso: string, lang: "en" | "id"): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(lang === "id" ? "id-ID" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const inputBase =
  "w-full rounded-md border border-white/10 bg-white/[0.02] px-3.5 py-3 text-sm text-white outline-none transition-colors duration-300 placeholder:text-gray-600 dark:placeholder:text-gray-400 hover:border-white/25 focus:border-accent focus:bg-white/[0.04]";

const labelBase =
  "mb-1.5 block text-xs uppercase tracking-[0.2em] text-gray-400";

export default function CommentsClient({ initial }: { initial: GuestComment[] }) {
  const { t, lang } = useLanguage();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const maxChars = 1000;

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
      setStatus("sent");
      setName("");
      setEmail("");
      setMessage("");
      setRating(null);
    } catch {
      setErrorMsg(t(comments.errorGeneric));
      setStatus("error");
    }
  }

  return (
    <SmoothScroll>
      <main className="relative min-h-screen overflow-x-clip bg-ink">
        <CustomCursor />
        <SpiderWalker />
        <ScrollProgress />
        <PageControls />

        <h1 className="sr-only">{t(comments.heading)}</h1>

        <section id="comments" className="relative px-6 py-16 md:px-10 md:py-32">
          <div className="mx-auto max-w-6xl">
            <SectionHeading kicker={comments.kicker} heading={comments.heading} />

            <p className="max-w-2xl text-lg leading-relaxed text-gray-400">
              {t(comments.description)}
            </p>

            <div className="mt-12 grid gap-14 lg:grid-cols-[minmax(0,24rem)_1fr] lg:gap-16">
              <div>
                {status === "sent" ? (
                  <div
                    role="status"
                    aria-live="polite"
                    className="flex flex-col items-start gap-3 border-y border-[#22c55e]/30 bg-[#22c55e]/[0.06] px-5 py-6"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#22c55e]/40 bg-[#22c55e]/10 text-[#22c55e]">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                    <p className="text-sm leading-relaxed text-[#22c55e]">
                      {t(comments.success)}
                    </p>
                    <button
                      type="button"
                      onClick={() => setStatus("idle")}
                      className="inline-flex items-center text-xs uppercase tracking-widest text-gray-400 transition-colors hover:text-accent max-md:min-h-11"
                    >
                      {t(comments.again)}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
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

                    <div>
                      <h3 className="text-display text-xl uppercase text-white">
                        {t(comments.formTitle)}
                      </h3>
                    </div>

                    <label className="block">
                      <span className={labelBase}>
                        {t(comments.nameLabel)} <span className="text-accent">*</span>
                      </span>
                      <input
                        type="text"
                        name="name"
                        required
                        minLength={2}
                        maxLength={60}
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t(comments.namePlaceholder)}
                        className={inputBase}
                      />
                    </label>

                    <label className="block">
                      <span className={labelBase}>{t(comments.emailLabel)}</span>
                      <input
                        type="email"
                        name="email"
                        maxLength={120}
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t(comments.emailPlaceholder)}
                        className={inputBase}
                      />
                    </label>

                    <label className="block">
                      <span className={labelBase}>
                        {t(comments.messageLabel)} <span className="text-accent">*</span>
                      </span>
                      <textarea
                        name="message"
                        required
                        rows={4}
                        maxLength={maxChars}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={t(comments.messagePlaceholder)}
                        className={`${inputBase} resize-y`}
                      />
                      <span className="mt-1 block text-right font-data text-[11px] text-gray-500">
                        {message.length}/{maxChars}
                      </span>
                    </label>

                    <div>
                      <p id="c-rating-label" className={labelBase}>
                        {t(comments.ratingLabel)}
                      </p>
                      <div
                        role="group"
                        aria-labelledby="c-rating-label"
                        className="flex items-center gap-1"
                        onMouseLeave={() => setHoverRating(null)}
                      >
                        {Array.from({ length: 5 }, (_, i) => i + 1).map((v) => {
                          const active = (hoverRating ?? rating ?? 0) >= v;
                          return (
                            <button
                              key={v}
                              type="button"
                              aria-label={`${v}/5`}
                              aria-pressed={rating === v}
                              onMouseEnter={() => setHoverRating(v)}
                              onClick={() => setRating(rating === v ? null : v)}
                              className="touch-active -m-1 p-1.5 transition-colors duration-200"
                            >
                              <Star filled={active} size={18} />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {errorMsg && (
                      <p role="alert" className="text-sm text-[#f85149]">
                        {errorMsg}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={status === "sending"}
                      className="mt-1 inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-7 text-sm font-medium uppercase tracking-widest text-black transition-colors hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {status === "sending" ? t(comments.sending) : t(comments.submit)}
                    </button>
                  </form>
                )}
              </div>

              <div>
                <div className="flex items-baseline justify-between gap-4 border-b border-white/10 pb-3">
                  <h3 className="text-xs uppercase tracking-[0.2em] text-gray-400">
                    {t(comments.count)}
                  </h3>
                  <span className="font-data text-xs text-khaki">
                    {String(initial.length).padStart(2, "0")}
                  </span>
                </div>

                {initial.length === 0 ? (
                  <p className="py-8 text-sm text-gray-400">{t(comments.empty)}</p>
                ) : (
                  <ol className="divide-y divide-white/10">
                    {initial.map((c) => (
                      <li
                        key={c.id}
                        className="grid gap-1 py-5 sm:grid-cols-[7.5rem_1fr] sm:gap-5"
                      >
                        <time
                          dateTime={c.created_at}
                          className="font-data text-[11px] leading-6 text-khaki"
                        >
                          {formatDate(c.created_at, lang)}
                        </time>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <p className="text-display text-base uppercase tracking-wide text-white">
                              {c.name}
                            </p>
                            {typeof c.rating === "number" && <Stars value={c.rating} />}
                          </div>
                          <p className="mt-1.5 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-ecru">
                            {c.message}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>

            <Link
              href="/"
              className="mt-16 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-gray-400 transition-colors hover:text-accent max-md:min-h-11"
            >
              <span aria-hidden="true">←</span> {t(comments.backHome)}
            </Link>
          </div>
        </section>
      </main>
    </SmoothScroll>
  );
}
