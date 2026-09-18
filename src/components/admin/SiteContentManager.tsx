"use client";

import { useCallback, useEffect, useState } from "react";
import Field from "@/components/admin/Field";
import {
  RefreshIcon,
  SpinnerIcon,
  LockIcon,
  InboxIcon,
} from "@/components/admin/icons";

// ============================================================================
// SiteContentManager — editor konten situs.
//
// Mengedit nilai yang meng-override src/lib/config.ts. Seksi disimpan terpisah
// (satu baris DB per seksi) supaya perubahan di satu seksi tidak menimpa seksi
// lain, dan tombol "Reset" bisa mengembalikan satu seksi saja ke default.
//
// Editor di sini sengaja generik (field teks per-key) alih-alih form khusus
// per seksi: bentuk data berbeda-beda dan terus berkembang, sementara struktur
// JSON-nya sudah tervalidasi di server (bentuk harus cocok dengan default).
// ============================================================================

type Section = {
  key: string;
  data: unknown;
  overridden: boolean;
  updated_at: string | null;
};

const SECTION_LABEL: Record<string, string> = {
  nav: "Menu Navigasi",
  profile: "Profil & Kontak",
  hero: "Hero",
  about: "About",
  whatIDo: "What I Do",
  education: "Pendidikan",
  techStack: "Tech Stack",
};

const SECTION_HINT: Record<string, string> = {
  nav: "Daftar menu di header. Format: [{ en, id }]",
  profile: "Nama, email, lokasi, CV, dan tautan sosial.",
  hero: "Role, tagline, dan baris judul besar.",
  about: "Kicker, paragraf, dan tombol CV.",
  whatIDo: "Daftar layanan beserta deskripsinya.",
  education: "Riwayat pendidikan.",
  techStack: "Kategori dan daftar teknologi.",
};

/** Tampilkan JSON rapi; bentuk data berbeda-beda per seksi. */
function pretty(v: unknown): string {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return "";
  }
}

export default function SiteContentManager() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/site-content", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Gagal memuat konten situs");
        setSections([]);
      } else {
        setSections((data?.sections as Section[]) ?? []);
        if (data?.migrated === false) {
          setError(
            "Tabel site_content belum ada. Jalankan supabase/tahap3.sql di Supabase SQL Editor — nilai di bawah masih default dari kode.",
          );
        }
      }
    } catch {
      setError("Gagal memuat konten situs");
      setSections([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function open(s: Section) {
    setOpenKey(openKey === s.key ? null : s.key);
    setDraft(pretty(s.data));
    setMessage(null);
  }

  async function save(key: string) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(draft);
    } catch {
      setMessage("JSON tidak valid — periksa tanda kutip dan koma.");
      return;
    }

    setBusyKey(key);
    setMessage(null);
    const res = await fetch("/api/site-content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, data: parsed }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data?.error ?? "Gagal menyimpan");
    } else {
      setMessage(`Seksi "${SECTION_LABEL[key] ?? key}" tersimpan ✓`);
      await load();
      setOpenKey(null);
    }
    setBusyKey(null);
  }

  async function reset(key: string) {
    if (
      !confirm(
        `Kembalikan "${SECTION_LABEL[key] ?? key}" ke default dari kode? Perubahan yang tersimpan akan hilang.`,
      )
    )
      return;

    setBusyKey(key);
    setMessage(null);
    const res = await fetch(`/api/site-content?key=${encodeURIComponent(key)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setMessage(`"${SECTION_LABEL[key] ?? key}" dikembalikan ke default ✓`);
      await load();
      setOpenKey(null);
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage(data?.error ?? "Gagal mereset seksi");
    }
    setBusyKey(null);
  }

  const overriddenCount = sections.filter((s) => s.overridden).length;

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-gray-500">
            Konten
          </p>
          <h2 className="text-display flex items-center gap-3 text-2xl uppercase text-white">
            Site Content
            {overriddenCount > 0 && (
              <span className="rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 text-xs font-normal tracking-normal text-accent">
                {overriddenCount} diedit
              </span>
            )}
          </h2>
        </div>
        <button
          onClick={load}
          aria-label="Muat ulang"
          title="Muat ulang"
          disabled={loading}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-gray-300 transition-colors duration-300 hover:border-accent hover:text-accent active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? <SpinnerIcon /> : <RefreshIcon />}
        </button>
      </div>

      <p className="mb-6 max-w-2xl text-sm leading-relaxed text-gray-500">
        Nilai di sini <strong className="text-gray-300">menimpa</strong> default
        di <code className="text-accent">src/lib/config.ts</code>. Seksi yang
        belum diedit memakai nilai dari kode — jadi situs tidak pernah kosong.
        Setelah menyimpan, perubahan tampil di situs pada muat ulang berikutnya.
      </p>

      {error && (
        <p className="mb-4 border-l-2 border-yellow-500/60 bg-yellow-500/5 px-3 py-2 text-sm text-yellow-300">
          {error}
        </p>
      )}
      {message && (
        <p className="mb-4 border-l-2 border-accent px-3 py-2 text-sm text-gray-300">
          {message}
        </p>
      )}

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : sections.length === 0 ? (
        <div className="mb-8 flex flex-col items-center gap-3 border-y border-white/10 py-14 text-center">
          <InboxIcon className="text-gray-600" />
          <p className="text-sm text-gray-500">Tidak ada seksi.</p>
        </div>
      ) : (
        <div className="admin-list mb-8 flex flex-col gap-3">
          {sections.map((s) => {
            const isOpen = openKey === s.key;
            const busy = busyKey === s.key;
            return (
              <article
                key={s.key}
                className={`border p-4 transition-colors duration-300 sm:p-5 ${
                  isOpen ? "border-accent/40" : "border-white/10 hover:border-accent/40"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => open(s)}
                    aria-expanded={isOpen}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <p className="text-sm font-semibold text-white">
                        {SECTION_LABEL[s.key] ?? s.key}
                      </p>
                      <code className="text-[11px] text-gray-500">{s.key}</code>
                      {s.overridden ? (
                        <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-accent">
                          Diedit
                        </span>
                      ) : (
                        <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] uppercase tracking-widest text-gray-500">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {SECTION_HINT[s.key] ?? ""}
                    </p>
                  </button>

                  {s.overridden && (
                    <button
                      onClick={() => reset(s.key)}
                      disabled={busy}
                      title="Kembalikan ke default kode"
                      className="shrink-0 rounded-md border border-white/15 px-3 py-1.5 text-[10px] uppercase tracking-widest text-gray-400 transition-colors duration-300 hover:border-yellow-500/60 hover:text-yellow-400 disabled:opacity-50"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {isOpen && (
                  <div className="mt-4 border-t border-white/5 pt-4">
                    <Field
                      label="Data (JSON)"
                      textarea
                      value={draft}
                      onChange={setDraft}
                    />
                    <p className="mt-2 flex items-start gap-2 text-[11px] leading-relaxed text-gray-500">
                      <LockIcon className="mt-0.5 shrink-0" />
                      <span>
                        Bentuk data divalidasi di server: harus cocok dengan
                        struktur default (objek tetap objek, array tetap array).
                        Untuk teks, gunakan pasangan{" "}
                        <code className="text-accent">{`{ "en": "…", "id": "…" }`}</code>.
                      </span>
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        onClick={() => save(s.key)}
                        disabled={busy}
                        className="rounded-md bg-accent px-5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition-colors duration-300 hover:bg-accent-soft disabled:opacity-50"
                      >
                        {busy ? "Menyimpan…" : "Simpan seksi"}
                      </button>
                      <button
                        onClick={() => setOpenKey(null)}
                        className="rounded-md border border-white/15 px-5 py-2 text-xs uppercase tracking-[0.16em] text-gray-300 transition-colors duration-300 hover:border-white/30 hover:text-white"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
