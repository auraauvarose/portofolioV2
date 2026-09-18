"use client";

import { useCallback, useEffect, useState } from "react";
import {
  InboxIcon,
  RefreshIcon,
  TrashIcon,
  SpinnerIcon,
  EyeIcon,
  EyeOffIcon,
} from "@/components/admin/icons";
import type { GuestComment } from "@/types";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(iso: string): string {
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

function Stars({ value }: { value: number | null }) {
  if (typeof value !== "number") return null;
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Rating ${value}/5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill={i < value ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.8"
          className={i < value ? "text-accent" : "text-gray-600"}
          aria-hidden="true"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  );
}

export default function CommentsManager() {
  const [items, setItems] = useState<GuestComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "visible">("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/comments?scope=admin", { cache: "no-store" });
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
    if (!confirm(`Hapus komentar dari "${c.name}"? Tindakan ini permanen.`)) return;
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

  const pendingCount = items.filter((c) => !c.approved).length;
  const visible =
    filter === "all"
      ? items
      : filter === "pending"
        ? items.filter((c) => !c.approved)
        : items.filter((c) => c.approved);

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-gray-500">
            Moderasi
          </p>
          <h2 className="text-display flex items-center gap-3 text-2xl uppercase text-white">
            Comments
            <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs font-normal tracking-normal text-accent">
              {loading ? "…" : items.length}
            </span>
            {!loading && pendingCount > 0 && (
              <span className="rounded-full border border-yellow-500/40 bg-yellow-500/10 px-2.5 py-0.5 text-xs font-normal tracking-normal text-yellow-400">
                {pendingCount} menunggu
              </span>
            )}
          </h2>
        </div>
        <button
          onClick={load}
          aria-label="Refresh comments"
          title="Refresh"
          disabled={loading}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-gray-300 transition-colors duration-300 hover:border-accent hover:text-accent active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? <SpinnerIcon /> : <RefreshIcon />}
        </button>
      </div>

      {error && (
        <p className="mb-4 border-l-2 border-red-500 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {/* Filter moderasi */}
      <div className="mb-6 flex flex-wrap gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1">
        {([
          { key: "all", label: "Semua", n: items.length },
          { key: "pending", label: "Menunggu", n: pendingCount },
          { key: "visible", label: "Tayang", n: items.length - pendingCount },
        ] as const).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={`rounded-md px-3 py-1.5 text-xs uppercase tracking-[0.14em] transition-colors duration-300 ${
              filter === f.key
                ? "bg-accent text-black"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            {f.label}
            <span className="ml-1.5 opacity-70">{f.n}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : visible.length === 0 ? (
        <div className="mb-8 flex flex-col items-center gap-3 border-y border-white/10 py-14 text-center">
          <InboxIcon className="text-gray-600" />
          <p className="text-sm text-gray-500">
            {filter === "all"
              ? "Belum ada komentar."
              : filter === "pending"
                ? "Tidak ada komentar yang menunggu moderasi."
                : "Belum ada komentar yang tayang."}
          </p>
        </div>
      ) : (
        <div className="admin-list mb-8 flex flex-col gap-4">
          {visible.map((c) => (
            <article
              key={c.id}
              className={`border p-4 transition-colors duration-300 sm:p-5 ${
                c.approved
                  ? "border-white/10 hover:border-accent/40"
                  : "border-yellow-500/30 bg-yellow-500/[0.03] hover:border-yellow-500/50"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="text-display flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/20 text-sm text-accent"
                  >
                    {initialsOf(c.name)}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <p className="truncate text-sm font-semibold text-white">
                        {c.name}
                      </p>
                      <Stars value={c.rating} />
                      {!c.approved && (
                        <span className="rounded-full border border-yellow-500/40 bg-yellow-500/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-yellow-400">
                          Menunggu
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {formatDate(c.created_at)}
                    </p>
                    {/* Email pengirim — hanya tampil di admin */}
                    <a
                      href={c.email ? `mailto:${c.email}` : undefined}
                      className={`mt-1 inline-block max-w-full truncate text-xs transition-colors ${
                        c.email
                          ? "text-accent hover:text-accent-soft"
                          : "cursor-default text-gray-600"
                      }`}
                      title={c.email ?? "Tanpa email"}
                    >
                      {c.email ?? "— tanpa email —"}
                    </a>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {/* Setujui / sembunyikan — inti moderasi */}
                  <button
                    onClick={() => setApproved(c, !c.approved)}
                    disabled={busyId === c.id}
                    aria-label={
                      c.approved
                        ? `Sembunyikan komentar dari ${c.name}`
                        : `Tampilkan komentar dari ${c.name}`
                    }
                    title={c.approved ? "Sembunyikan dari publik" : "Tampilkan ke publik"}
                    className={`flex h-9 items-center gap-2 rounded-md border px-3 text-[10px] uppercase tracking-widest transition-colors duration-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${
                      c.approved
                        ? "border-white/15 text-gray-400 hover:border-yellow-500/60 hover:text-yellow-400"
                        : "border-[#22c55e]/40 bg-[#22c55e]/10 text-[#22c55e] hover:bg-[#22c55e]/20"
                    }`}
                  >
                    {c.approved ? <EyeOffIcon /> : <EyeIcon />}
                    {c.approved ? "Sembunyikan" : "Tampilkan"}
                  </button>
                  <button
                    onClick={() => remove(c)}
                    disabled={busyId === c.id}
                    aria-label={`Hapus komentar dari ${c.name}`}
                    title="Hapus komentar"
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-gray-400 transition-colors duration-300 hover:border-red-500 hover:text-red-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busyId === c.id ? <SpinnerIcon /> : <TrashIcon />}
                  </button>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap break-words border-t border-white/5 pt-3 text-sm leading-relaxed text-ecru">
                {c.message}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
