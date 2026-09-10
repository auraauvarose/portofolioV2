"use client";

import { useCallback, useEffect, useState } from "react";
import {
  InboxIcon,
  RefreshIcon,
  TrashIcon,
  SpinnerIcon,
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
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  async function remove(c: GuestComment) {
    if (!confirm(`Hapus komentar dari "${c.name}"? Tindakan ini permanen.`)) return;
    setDeletingId(c.id);
    const res = await fetch(`/api/comments?id=${encodeURIComponent(c.id)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setItems((prev) => prev.filter((x) => x.id !== c.id));
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Gagal menghapus komentar");
    }
    setDeletingId(null);
  }

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

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : items.length === 0 ? (
        <div className="mb-8 flex flex-col items-center gap-3 border-y border-white/10 py-14 text-center">
          <InboxIcon className="text-gray-600" />
          <p className="text-sm text-gray-500">Belum ada komentar.</p>
        </div>
      ) : (
        <div className="admin-list mb-8 flex flex-col gap-4">
          {items.map((c) => (
            <article
              key={c.id}
              className="border border-white/10 p-4 transition-colors duration-300 hover:border-accent/40 sm:p-5"
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
                          Hidden
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
                <button
                  onClick={() => remove(c)}
                  disabled={deletingId === c.id}
                  aria-label={`Hapus komentar dari ${c.name}`}
                  title="Hapus komentar"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/15 text-gray-400 transition-colors duration-300 hover:border-red-500 hover:text-red-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingId === c.id ? <SpinnerIcon /> : <TrashIcon />}
                </button>
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
