"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  InboxIcon,
  RefreshIcon,
  TrashIcon,
  SpinnerIcon,
} from "@/components/admin/icons";
import type { ContactMessage, ContactStatus } from "@/types";

const STATUS_LABEL: Record<ContactStatus, string> = {
  new: "Baru",
  read: "Dibaca",
  replied: "Dibalas",
  archived: "Diarsipkan",
};

const STATUS_STYLE: Record<ContactStatus, string> = {
  new: "border-accent/40 bg-accent/10 text-accent",
  read: "border-white/20 bg-white/5 text-gray-300",
  replied: "border-[#22c55e]/40 bg-[#22c55e]/10 text-[#22c55e]",
  archived: "border-white/10 bg-transparent text-gray-500",
};

type Filter = "all" | ContactStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "new", label: "Baru" },
  { key: "read", label: "Dibaca" },
  { key: "replied", label: "Dibalas" },
  { key: "archived", label: "Arsip" },
];

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

/** Body pesan + tombol balas lewat email, diisi otomatis subjek & kutipan. */
function mailtoReply(m: ContactMessage): string {
  const subject = m.subject
    ? `Re: ${m.subject}`
    : "Re: pesan dari portofolio";
  const quoted = m.message
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
  const body = `Halo ${m.name},\n\n\n\n— — —\nPesanmu sebelumnya:\n${quoted}`;
  return `mailto:${m.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function MessagesManager() {
  const [items, setItems] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/contact", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Gagal memuat pesan");
        setItems([]);
      } else {
        setItems((data?.messages as ContactMessage[]) ?? []);
      }
    } catch {
      setError("Gagal memuat pesan");
      setItems([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const base: Record<Filter, number> = {
      all: items.length,
      new: 0,
      read: 0,
      replied: 0,
      archived: 0,
    };
    for (const m of items) base[m.status] += 1;
    return base;
  }, [items]);

  const visible = useMemo(
    () => (filter === "all" ? items : items.filter((m) => m.status === filter)),
    [items, filter],
  );

  async function setStatus(m: ContactMessage, status: ContactStatus) {
    setBusyId(m.id);
    setError(null);
    const res = await fetch("/api/contact", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: m.id, status }),
    });
    if (res.ok) {
      setItems((prev) =>
        prev.map((x) => (x.id === m.id ? { ...x, status } : x)),
      );
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Gagal memperbarui status");
    }
    setBusyId(null);
  }

  async function remove(m: ContactMessage) {
    if (!confirm(`Hapus pesan dari "${m.name}"? Tindakan ini permanen.`)) return;
    setBusyId(m.id);
    setError(null);
    const res = await fetch(`/api/contact?id=${encodeURIComponent(m.id)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setItems((prev) => prev.filter((x) => x.id !== m.id));
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Gagal menghapus pesan");
    }
    setBusyId(null);
  }

  function toggleExpand(m: ContactMessage) {
    const next = expanded === m.id ? null : m.id;
    setExpanded(next);
    // Buka pesan baru otomatis menandainya "dibaca".
    if (next && m.status === "new") void setStatus(m, "read");
  }

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-gray-500">
            Inbox
          </p>
          <h2 className="text-display flex items-center gap-3 text-2xl uppercase text-white">
            Messages
            {counts.new > 0 && (
              <span className="rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 text-xs font-normal tracking-normal text-accent">
                {counts.new} baru
              </span>
            )}
          </h2>
        </div>
        <button
          onClick={load}
          aria-label="Refresh messages"
          title="Refresh"
          disabled={loading}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-gray-300 transition-colors duration-300 hover:border-accent hover:text-accent active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? <SpinnerIcon /> : <RefreshIcon />}
        </button>
      </div>

      {/* Filter status */}
      <div className="mb-6 flex flex-wrap gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1">
        {FILTERS.map((f) => (
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
            <span className="ml-1.5 opacity-70">{counts[f.key]}</span>
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-4 border-l-2 border-red-500 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : visible.length === 0 ? (
        <div className="mb-8 flex flex-col items-center gap-3 border-y border-white/10 py-14 text-center">
          <InboxIcon className="text-gray-600" />
          <p className="text-sm text-gray-500">
            {filter === "all"
              ? "Belum ada pesan masuk."
              : `Tidak ada pesan berstatus "${STATUS_LABEL[filter as ContactStatus]}".`}
          </p>
        </div>
      ) : (
        <div className="admin-list mb-8 flex flex-col gap-3">
          {visible.map((m) => {
            const isOpen = expanded === m.id;
            const busy = busyId === m.id;
            return (
              <article
                key={m.id}
                className={`border p-4 transition-colors duration-300 sm:p-5 ${
                  m.status === "new"
                    ? "border-accent/30 bg-accent/[0.03]"
                    : "border-white/10 hover:border-accent/40"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => toggleExpand(m)}
                    aria-expanded={isOpen}
                    className="flex min-w-0 flex-1 items-start gap-3 text-left"
                  >
                    <span
                      aria-hidden="true"
                      className="text-display flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/20 text-sm text-accent"
                    >
                      {initialsOf(m.name)}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <p className="truncate text-sm font-semibold text-white">
                          {m.name}
                        </p>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-widest ${STATUS_STYLE[m.status]}`}
                        >
                          {STATUS_LABEL[m.status]}
                        </span>
                        {m.budget && (
                          <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-gray-400">
                            {m.budget}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-gray-500">
                        {formatDate(m.created_at)}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-accent">
                        {m.email}
                      </p>
                      {!isOpen && (
                        <p className="mt-1.5 truncate text-sm text-gray-400">
                          {m.subject ? `${m.subject} — ` : ""}
                          {m.message}
                        </p>
                      )}
                    </div>
                  </button>

                  <div className="flex shrink-0 items-center gap-2">
                    <a
                      href={mailtoReply(m)}
                      title="Balas lewat email"
                      aria-label={`Balas pesan dari ${m.name}`}
                      onClick={() => {
                        if (m.status === "new" || m.status === "read") {
                          void setStatus(m, "replied");
                        }
                      }}
                      className="flex h-9 items-center gap-2 rounded-md border border-white/15 px-3 text-xs uppercase tracking-widest text-gray-300 transition-colors duration-300 hover:border-accent hover:text-accent active:scale-[0.98]"
                    >
                      Balas
                    </a>
                    <button
                      onClick={() => remove(m)}
                      disabled={busy}
                      aria-label={`Hapus pesan dari ${m.name}`}
                      title="Hapus pesan"
                      className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-gray-400 transition-colors duration-300 hover:border-red-500 hover:text-red-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {busy ? <SpinnerIcon /> : <TrashIcon />}
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-4 border-t border-white/5 pt-4">
                    {m.subject && (
                      <p className="mb-2 text-xs uppercase tracking-widest text-gray-500">
                        {m.subject}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-ecru">
                      {m.message}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="mr-1 text-[10px] uppercase tracking-[0.2em] text-gray-500">
                        Tandai:
                      </span>
                      {(["new", "read", "replied", "archived"] as ContactStatus[])
                        .filter((s) => s !== m.status)
                        .map((s) => (
                          <button
                            key={s}
                            onClick={() => setStatus(m, s)}
                            disabled={busy}
                            className="rounded-md border border-white/15 px-2.5 py-1 text-[10px] uppercase tracking-widest text-gray-400 transition-colors duration-300 hover:border-accent hover:text-accent disabled:opacity-50"
                          >
                            {STATUS_LABEL[s]}
                          </button>
                        ))}
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
