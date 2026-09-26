"use client";

import { useState, type FormEvent } from "react";
import { useLanguage } from "@/components/providers";
import { contactForm } from "@/lib/config";

type Status = "idle" | "sending" | "sent" | "error";

const inputBase =
  "w-full rounded-md border border-white/10 bg-white/[0.02] px-3.5 py-3 text-sm text-white outline-none transition-colors duration-300 placeholder:text-gray-600 hover:border-white/25 focus:border-accent focus:bg-white/[0.04]";

const labelBase =
  "mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-gray-400";

export default function ContactForm() {
  const { t } = useLanguage();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;

    setStatus("sending");
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message, website }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? t(contactForm.errors.generic));
        setStatus("error");
        return;
      }

      setStatus("sent");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch {
      setError(t(contactForm.errors.generic));
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
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
          {t(contactForm.success)}
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="text-xs uppercase tracking-widest text-gray-400 transition-colors hover:text-accent"
        >
          {t(contactForm.openLabel)}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <h3 className="text-display text-xl uppercase text-white">
          {t(contactForm.heading)}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
          {t(contactForm.description)}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelBase}>
            {t(contactForm.nameLabel)} <span className="text-accent">*</span>
          </span>
          <input
            type="text"
            name="name"
            required
            minLength={2}
            maxLength={80}
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t(contactForm.namePlaceholder)}
            className={inputBase}
          />
        </label>

        <label className="block">
          <span className={labelBase}>
            {t(contactForm.emailLabel)} <span className="text-accent">*</span>
          </span>
          <input
            type="email"
            name="email"
            required
            maxLength={160}
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t(contactForm.emailPlaceholder)}
            className={inputBase}
          />
        </label>

        <label className="block">
          <span className={labelBase}>{t(contactForm.subjectLabel)}</span>
          <input
            type="text"
            name="subject"
            maxLength={140}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t(contactForm.subjectPlaceholder)}
            className={inputBase}
          />
        </label>
      </div>

      <label className="block">
        <span className={labelBase}>
          {t(contactForm.messageLabel)} <span className="text-accent">*</span>
        </span>
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={4000}
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t(contactForm.messagePlaceholder)}
          className={`${inputBase} resize-y`}
        />
      </label>

      <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden">
        <label>
          Website
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>

      {error && (
        <p
          role="alert"
          className="border-l-2 border-red-500 bg-red-500/5 px-3 py-2 text-sm text-red-300"
        >
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={status === "sending"}
          className="rounded-md bg-accent px-7 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-black transition-colors duration-300 hover:bg-accent-soft active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "sending" ? t(contactForm.sending) : t(contactForm.submit)}
        </button>
        <p className="text-xs leading-relaxed text-gray-600">
          {t(contactForm.emailLabel)}:{" "}
          <a
            href="mailto:auraauvaroseendica@gmail.com"
            className="text-gray-400 underline decoration-gray-700 underline-offset-2 transition-colors hover:text-accent"
          >
            auraauvaroseendica@gmail.com
          </a>
        </p>
      </div>
    </form>
  );
}
