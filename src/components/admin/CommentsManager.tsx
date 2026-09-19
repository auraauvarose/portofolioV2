"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReportCount } from "@/components/admin/admin-counts";
import {
  Button,
  Chip,
  EmptyState,
  IconButton,
  ListSkeleton,
  Notice,
  PanelHeader,
  SegmentedFilter,
} from "@/components/admin/ui";
import {
  ChatIcon,
  RefreshIcon,
  TrashIcon,
  SpinnerIcon,
  EyeIcon,
  EyeOffIcon,
  SearchIcon,
  StarIcon,
} from "@/components/admin/icons";
import type { GuestComment } from "@/types";

// ============================================================================
// CommentsManager — moderasi buku tamu.
//
// Dua pekerjaan yang berbeda: menyetujui yang menunggu (antrean) dan
// menyembunyikan yang sudah tayang. Filter bawaan karena itu "Menunggu" —
// bukan "Semua" — supaya tugas utama langsung terlihat.
// ============================================================================

type Filter = "pending" | "visible" | "all";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatFull(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Bintang penuh untuk nilai rating; hanya dirender bila rating ada. */
function Stars({ value }: { value: number | null }) {
  if (typeof value !== "number") return null;
  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={`Rating ${value} dari 5`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon
          key={i}
          filled={i < value}
          className={`h-3 w-3 ${
            i < value
              ? "text-[var(--color-a-accent)]"
              : "text-[var(--color-a-line-2)]"
          }`}
        />
      ))}
    </span>
  );
}

export default function CommentsManager() {
  const [items, setItems] = useState<GuestComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("pending");
  // Apakah pengguna sudah memilih filter sendiri. Selama belum, filter
  // mengikuti keadaan data: antrean moderasi kalau ada yang menunggu —
  // kalau tidak, langsung tampilkan semua supaya tidak mendarat di layar
  // kosong padahal ada 11 komentar.
  const filterTouched = useRef(false);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/comments?scope=admin", {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Gagal memuat komentar");
        setItems([]);
      } else {
        setItems((data?.comments as GuestComment[]) ?? []);
      }
    } catch {
      setError("Gagal memuat komentar");
      setItems([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setApproved(c: GuestComment, approved: boolean) {
    setBusyId(c.id);
    setError(null);
    const res = await fetch("/api/comments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id, approved }),
    });
    if (res.ok) {
      setItems((prev) =>
        prev.map((x) => (x.id === c.id ? { ...x, approved } : x)),
      );
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Gagal memperbarui komentar");
    }
    setBusyId(null);
  }

  async function remove(c: GuestComment) {
    if (!confirm(`Hapus komentar dari "${c.name}"? Tindakan ini permanen.`))
      return;
    setBusyId(c.id);
    const res = await fetch(`/api/comments?id=${encodeURIComponent(c.id)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setItems((prev) => prev.filter((x) => x.id !== c.id));
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Gagal menghapus komentar");
    }
    setBusyId(null);
  }

  const pendingCount = useMemo(
    () => items.filter((c) => !c.approved).length,
    [items],
  );

  // Rail memakai angka yang sama — tidak perlu mengambil ulang dari server.
  useReportCount("comments", pendingCount);

  // Setelah data tiba: kalau tidak ada yang menunggu dan pengguna belum
  // menyentuh filter, pindah ke "Semua". Tanpa ini, panel terbuka pada
  // daftar kosong padahal ada puluhan komentar tayang.
  useEffect(() => {
    if (loading || filterTouched.current) return;
    setFilter(pendingCount > 0 ? "pending" : "all");
  }, [loading, pendingCount]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((c) => {
      if (filter === "pending" && c.approved) return false;
      if (filter === "visible" && !c.approved) return false;
      if (!q) return true;
      return [c.name, c.email ?? "", c.message]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [items, filter, query]);

  return (
    <div>
      <PanelHeader
        title="Komentar"
        description="Komentar tamu tampil di situs publik hanya setelah ditampilkan di sini."
        meta={
          !loading && (
            <>
              <Chip tone="neutral">{items.length} total</Chip>
              {pendingCount > 0 ? (
                <Chip tone="warn">{pendingCount} menunggu</Chip>
              ) : (
                <Chip tone="ok">semua termoderasi</Chip>
              )}
            </>
          )
        }
        actions={
          <IconButton
            icon={loading ? SpinnerIcon : RefreshIcon}
            label="Muat ulang"
            disabled={loading}
            onClick={load}
          />
        }
      />

      {error && (
        <Notice tone="error" onDismiss={() => setError(null)}>
          {error}
        </Notice>
      )}

      {!loading && items.length > 0 && (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <SegmentedFilter
            label="Filter moderasi"
            value={filter}
            onChange={(key) => {
              // Pilihan manual mengunci filter — efek auto-pilih berhenti.
              filterTouched.current = true;
              setFilter(key);
            }}
            options={[
              { key: "pending", label: "Menunggu", count: pendingCount },
              {
                key: "visible",
                label: "Tayang",
                count: items.length - pendingCount,
              },
              { key: "all", label: "Semua", count: items.length },
            ]}
          />

          <div className="flex w-full min-w-0 items-center gap-2 rounded-lg border border-[var(--color-a-line-2)] bg-[var(--color-a-surface)] px-3 sm:w-72">
            <SearchIcon className="h-4 w-4 shrink-0 text-[var(--color-a-faint)]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama, email, atau isi komentar…"
              aria-label="Cari komentar"
              className="w-full bg-transparent py-2 text-sm text-[var(--color-a-text)] outline-none placeholder:text-[var(--color-a-faint)]"
            />
          </div>
        </div>
      )}

      {loading ? (
        <ListSkeleton rows={4} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={ChatIcon}
          title="Belum ada komentar"
          hint="Komentar dari buku tamu di halaman utama akan muncul di sini untuk dimoderasi."
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={ChatIcon}
          title={
            query
              ? `Tidak ada yang cocok dengan “${query}”`
              : filter === "pending"
                ? "Tidak ada komentar yang menunggu"
                : "Belum ada komentar yang tayang"
          }
          hint={
            !query && filter === "pending"
              ? "Semua komentar sudah ditinjau."
              : undefined
          }
          action={
            query ? (
              <Button variant="ghost" onClick={() => setQuery("")}>
                Hapus pencarian
              </Button>
            ) : filter === "pending" ? (
              <Button variant="ghost" onClick={() => setFilter("all")}>
                Lihat semua komentar
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {visible.map((c) => {
            const busy = busyId === c.id;
            return (
              <article
                key={c.id}
                className={`overflow-hidden rounded-xl border transition-colors ${
                  c.approved
                    ? "border-[var(--color-a-line)] hover:border-[var(--color-a-line-2)]"
                    : "border-[var(--color-a-warn)]/40 bg-[var(--color-a-warn)]/[0.04]"
                }`}
              >
                <div className="flex flex-wrap items-start gap-3 p-3.5">
                  <span
                    aria-hidden="true"
                    className="text-display flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--color-a-line)] bg-[var(--color-a-surface-2)] a-meta text-[var(--color-a-dim)]"
                  >
                    {initialsOf(c.name)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <p className="truncate text-sm font-medium text-[var(--color-a-text)]">
                        {c.name}
                      </p>
                      <Stars value={c.rating} />
                      {c.approved ? (
                        <Chip tone="ok">tayang</Chip>
                      ) : (
                        <Chip tone="warn">menunggu</Chip>
                      )}
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 a-meta text-[var(--color-a-faint)]">
                      {/* Email hanya tampil di admin — tidak pernah di publik. */}
                      {c.email ? (
                        <a
                          href={`mailto:${c.email}`}
                          className="a-data text-[var(--color-a-accent)] transition-opacity hover:opacity-80"
                        >
                          {c.email}
                        </a>
                      ) : (
                        <span className="a-data">tanpa email</span>
                      )}
                      <span aria-hidden="true">·</span>
                      <span className="a-data">{formatFull(c.created_at)}</span>
                    </p>
                    <p className="mt-2.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--color-a-text)]">
                      {c.message}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    {/* Inti moderasi: satu tombol yang membalik status tayang. */}
                    <button
                      type="button"
                      onClick={() => setApproved(c, !c.approved)}
                      disabled={busy}
                      aria-label={
                        c.approved
                          ? `Sembunyikan komentar dari ${c.name}`
                          : `Tampilkan komentar dari ${c.name}`
                      }
                      title={
                        c.approved
                          ? "Sembunyikan dari publik"
                          : "Tampilkan ke publik"
                      }
                      className={`a-btn ${
                        c.approved ? "a-btn-ghost" : "a-btn-primary"
                      }`}
                    >
                      {busy ? (
                        <SpinnerIcon className="h-3.5 w-3.5" />
                      ) : c.approved ? (
                        <EyeOffIcon className="h-3.5 w-3.5" />
                      ) : (
                        <EyeIcon className="h-3.5 w-3.5" />
                      )}
                      {c.approved ? "Sembunyikan" : "Tampilkan"}
                    </button>
                    <IconButton
                      icon={TrashIcon}
                      label={`Hapus komentar dari ${c.name}`}
                      danger
                      disabled={busy}
                      onClick={() => remove(c)}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
