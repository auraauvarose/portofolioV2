"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Field from "@/components/admin/Field";
import {
  Button,
  Chip,
  EmptyState,
  FormActions,
  IconButton,
  ListSkeleton,
  Notice,
  PanelHeader,
} from "@/components/admin/ui";
import {
  RefreshIcon,
  LockIcon,
  LayoutIcon,
  CheckIcon,
  AlertIcon,
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

/** Satu baris ringkas untuk pratinjau isi seksi di keadaan tertutup. */
function summarize(v: unknown): string {
  if (Array.isArray(v)) return `${v.length} item`;
  if (v && typeof v === "object") {
    const keys = Object.keys(v);
    return `${keys.length} field · ${keys.slice(0, 4).join(", ")}${
      keys.length > 4 ? "…" : ""
    }`;
  }
  return typeof v;
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

  // ── Validasi JSON langsung saat mengetik ──
  // Sebelumnya galat baru muncul setelah tombol Simpan ditekan. Sekarang
  // pengguna tahu ada salah ketik pada baris mana sebelum mencoba menyimpan.
  const parsed = useMemo(() => {
    if (!openKey) return { ok: true as const, value: undefined };
    try {
      return { ok: true as const, value: JSON.parse(draft) };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "JSON tidak valid";
      return { ok: false as const, error: msg };
    }
  }, [draft, openKey]);

  const active = sections.find((s) => s.key === openKey) ?? null;
  const dirty =
    active !== null &&
    parsed.ok &&
    pretty(parsed.value) !== pretty(active.data);

  function open(s: Section) {
    if (openKey === s.key) {
      setOpenKey(null);
      return;
    }
    setOpenKey(s.key);
    setDraft(pretty(s.data));
    setMessage(null);
  }

  async function save(key: string) {
    if (!parsed.ok) {
      setMessage("JSON tidak valid — perbaiki dulu sebelum menyimpan.");
      return;
    }

    setBusyKey(key);
    setMessage(null);
    const res = await fetch("/api/site-content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, data: parsed.value }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data?.error ?? "Gagal menyimpan");
    } else {
      setMessage(`Seksi "${SECTION_LABEL[key] ?? key}" tersimpan.`);
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
      setMessage(`"${SECTION_LABEL[key] ?? key}" dikembalikan ke default.`);
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
      <PanelHeader
        title="Konten situs"
        description="Nilai di sini menimpa default di src/lib/config.ts. Seksi yang belum diedit memakai nilai dari kode, jadi situs tidak pernah kosong. Perubahan tampil setelah situs dimuat ulang."
        meta={
          !loading && (
            <>
              <Chip tone="neutral">{sections.length} seksi</Chip>
              {overriddenCount > 0 && (
                <Chip tone="accent">{overriddenCount} diedit</Chip>
              )}
            </>
          )
        }
        actions={
          <IconButton
            icon={RefreshIcon}
            label="Muat ulang"
            disabled={loading}
            onClick={load}
          />
        }
      />

      {error && <Notice tone="warn">{error}</Notice>}
      {message && (
        <Notice
          tone={message.startsWith("Gagal") || message.startsWith("JSON") ? "error" : "ok"}
          onDismiss={() => setMessage(null)}
        >
          {message}
        </Notice>
      )}

      {loading ? (
        <ListSkeleton rows={5} />
      ) : sections.length === 0 ? (
        <EmptyState
          icon={LayoutIcon}
          title="Tidak ada seksi"
          hint="Jalankan supabase/tahap3.sql di Supabase SQL Editor untuk membuat tabel site_content."
        />
      ) : (
        <div className="mb-8 flex flex-col gap-2.5">
          {sections.map((s) => {
            const isOpen = openKey === s.key;
            const busy = busyKey === s.key;
            const label = SECTION_LABEL[s.key] ?? s.key;
            return (
              <article
                key={s.key}
                className={`overflow-hidden rounded-xl border transition-colors ${
                  isOpen
                    ? "border-[var(--color-a-accent)]/50"
                    : "border-[var(--color-a-line)] hover:border-[var(--color-a-line-2)]"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5">
                  <button
                    type="button"
                    onClick={() => open(s)}
                    aria-expanded={isOpen}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <p className="text-sm font-medium text-[var(--color-a-text)]">
                        {label}
                      </p>
                      {s.overridden ? (
                        <Chip tone="accent">diedit</Chip>
                      ) : (
                        <Chip tone="neutral">default</Chip>
                      )}
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 a-meta text-[var(--color-a-faint)]">
                      <code className="a-data">{s.key}</code>
                      <span aria-hidden="true">·</span>
                      <span className="a-data">{summarize(s.data)}</span>
                      {SECTION_HINT[s.key] && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{SECTION_HINT[s.key]}</span>
                        </>
                      )}
                    </p>
                  </button>

                  <div className="flex shrink-0 items-center gap-1.5">
                    {s.overridden && (
                      <Button
                        variant="quiet"
                        disabled={busy}
                        onClick={() => reset(s.key)}
                        title="Kembalikan ke default kode"
                      >
                        Reset
                      </Button>
                    )}
                    <Button
                      variant={isOpen ? "ghost" : "ghost"}
                      onClick={() => open(s)}
                      aria-expanded={isOpen}
                    >
                      {isOpen ? "Tutup" : "Edit"}
                    </Button>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-[var(--color-a-line)] p-4">
                    <Field
                      label="Data (JSON)"
                      textarea
                      rows={14}
                      value={draft}
                      onChange={setDraft}
                      hint={
                        <span className="flex items-start gap-1.5">
                          <LockIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span>
                            Bentuk data divalidasi di server: harus cocok dengan
                            struktur default (objek tetap objek, array tetap
                            array). Untuk teks, gunakan pasangan{" "}
                            <code className="a-data text-[var(--color-a-accent)]">
                              {`{ "en": "…", "id": "…" }`}
                            </code>
                            .
                          </span>
                        </span>
                      }
                    />

                    {/* Umpan balik validasi: status, bukan kalimat panjang. */}
                    <div className="mt-3 flex flex-wrap items-center gap-2 a-meta">
                      {parsed.ok ? (
                        <span className="inline-flex items-center gap-1.5 text-[var(--color-a-ok)]">
                          <CheckIcon className="h-3.5 w-3.5" />
                          JSON valid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[var(--color-a-danger)]">
                          <AlertIcon className="h-3.5 w-3.5" />
                          {parsed.error}
                        </span>
                      )}
                      {dirty && (
                        <span className="text-[var(--color-a-warn)]">
                          · ada perubahan belum disimpan
                        </span>
                      )}
                    </div>

                    <FormActions>
                      <Button
                        variant="primary"
                        disabled={busy || !parsed.ok || !dirty}
                        onClick={() => save(s.key)}
                      >
                        {busy ? "Menyimpan…" : "Simpan seksi"}
                      </Button>
                      <Button
                        variant="quiet"
                        onClick={() => {
                          setOpenKey(null);
                          setMessage(null);
                        }}
                      >
                        Batal
                      </Button>
                    </FormActions>
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
