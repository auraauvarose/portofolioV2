"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useLanguage } from "@/components/providers";

type Status = "idle" | "sending" | "sent" | "error";

const inputBase =
  "w-full rounded-md border border-white/10 bg-white/[0.02] px-3.5 py-3 text-sm text-white outline-none transition-colors duration-300 placeholder:text-gray-500 hover:border-white/25 focus:border-accent focus:bg-white/[0.04]";

const labelBase =
  "mb-1.5 block text-xs uppercase tracking-[0.2em] text-gray-400";

export default function CertificateRequestClient() {
  const { t } = useLanguage();

  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;

    setStatus("sending");
    setError(null);

    try {
      const res = await fetch("/api/certificate-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, purpose, website }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? "Gagal mengirim permintaan.");
        setStatus("error");
        return;
      }

      setStatus("sent");
      setName("");
      setPurpose("");
    } catch {
      setError("Gagal mengirim permintaan. Cek koneksi lalu coba lagi.");
      setStatus("error");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-6 py-16">
      <div className="w-full max-w-xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-gray-400 transition-colors hover:text-accent"
        >
          ← {t({ en: "Back", id: "Kembali" })}
        </Link>

        <div className="rounded-2xl border border-white/10 bg-panel p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] md:p-8">
          <div className="mb-6 flex items-start gap-3">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="mt-0.5 h-8 w-8 shrink-0 text-accent"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <div>
              <h1 className="text-xl font-semibold text-white md:text-2xl">
                {t({
                  en: "Request permission to view the certificate",
                  id: "Minta izin untuk melihat sertifikat",
                })}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-gray-400">
                {t({
                  en: "The certificate shows my full name, so the photo is locked. Tell me who you are and why you need it.",
                  id: "Foto sertifikat berisi nama lengkapku, jadi sengaja dikunci. Isi nama dan tujuanmu, nanti permintaannya masuk ke pemilik situs.",
                })}
              </p>
            </div>
          </div>

          {status === "sent" ? (
            <div
              role="status"
              aria-live="polite"
              className="flex flex-col items-start gap-3 border-y border-[#22c55e]/30 bg-[#22c55e]/[0.06] px-5 py-6"
            >
              <p className="text-sm leading-relaxed text-[#22c55e]">
                {t({
                  en: "Request sent. Wait for the owner to reply.",
                  id: "Permintaan terkirim. Tunggu balasan dari pemilik situs ya.",
                })}
              </p>
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="inline-flex items-center text-xs uppercase tracking-widest text-gray-400 transition-colors hover:text-accent max-md:min-h-11"
              >
                {t({ en: "Send another", id: "Kirim lagi" })}
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <label className="block">
                <span className={labelBase}>
                  {t({ en: "Name", id: "Nama" })} <span className="text-accent">*</span>
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
                  placeholder={t({ en: "Your name", id: "Nama kamu" })}
                  className={inputBase}
                />
              </label>

              <label className="block">
                <span className={labelBase}>
                  {t({ en: "Purpose", id: "Tujuan" })} <span className="text-accent">*</span>
                </span>
                <textarea
                  name="purpose"
                  required
                  minLength={3}
                  maxLength={1000}
                  rows={4}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder={t({
                    en: "Why do you need to see the certificate?",
                    id: "Kenapa perlu lihat sertifikatnya?",
                  })}
                  className={`${inputBase} resize-y`}
                />
              </label>

              {/* Honeypot: disembunyikan dari manusia, diisi bot. */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="hidden"
              />

              {error && (
                <p role="alert" className="text-sm text-[#f85149]">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "sending"}
                className="mt-1 inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-7 text-sm font-medium uppercase tracking-widest text-black transition-colors hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === "sending"
                  ? t({ en: "Sending…", id: "Mengirim…" })
                  : t({ en: "Send", id: "Kirim" })}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
