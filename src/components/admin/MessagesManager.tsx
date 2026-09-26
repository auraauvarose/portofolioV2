"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  InboxIcon,
  RefreshIcon,
  TrashIcon,
  SpinnerIcon,
  SearchIcon,
  CheckIcon,
} from "@/components/admin/icons";
import type { ContactMessage, ContactStatus } from "@/types";

const STATUS_LABEL: Record<ContactStatus, string> = {
  new: "Baru",
  read: "Dibaca",
  replied: "Dibalas",
  archived: "Arsip",
};

const STATUS_TONE: Record<ContactStatus, "accent" | "neutral" | "ok" | "warn"> =
  {
    new: "accent",
    read: "neutral",
    replied: "ok",
    archived: "neutral",
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

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatFull(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mailtoReply(m: ContactMessage): string {
  const subject = m.subject ? `Re: ${m.subject}` : "Re: pesan dari portofolio";
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
  const [query, setQuery] = useState("");

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

  useReportCount("messages", counts.new);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((m) => {
      if (filter !== "all" && m.status !== filter) return false;
      if (!q) return true;
      return [m.name, m.email, m.subject ?? "", m.message]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [items, filter, query]);

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
    if (next && m.status === "new") void setStatus(m, "read");
  }

  return (
    <div>
      <PanelHeader
        title="Pesan"
        description="Pesan dari formulir kontak di situs. Membuka pesan menandainya otomatis sebagai dibaca."
        meta={
          !loading && (
            <>
              <Chip tone="neutral">{items.length} total</Chip>
              {counts.new > 0 && <Chip tone="accent">{counts.new} baru</Chip>}
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
            label="Filter status pesan"
            value={filter}
            onChange={setFilter}
            options={FILTERS.map((f) => ({
              key: f.key,
              label: f.label,
              count: counts[f.key],
            }))}
          />

          <div className="flex w-full min-w-0 items-center gap-2 rounded-lg border border-[var(--color-a-line-2)] bg-[var(--color-a-surface)] px-3 sm:w-72">
            <SearchIcon className="h-4 w-4 shrink-0 text-[var(--color-a-faint)]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama, email, atau isi pesan…"
              aria-label="Cari pesan"
              className="w-full bg-transparent py-2 text-sm text-[var(--color-a-text)] outline-none placeholder:text-[var(--color-a-faint)]"
            />
          </div>
        </div>
      )}

      {loading ? (
        <ListSkeleton rows={5} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={InboxIcon}
          title="Kotak masuk kosong"
          hint="Pesan dari formulir kontak akan muncul di sini. Formulirnya ada di seksi Contact halaman utama."
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={SearchIcon}
          title={
            query
              ? `Tidak ada yang cocok dengan “${query}”`
              : `Tidak ada pesan berstatus "${STATUS_LABEL[filter as ContactStatus]}"`
          }
          action={
            <Button
              variant="ghost"
              onClick={() => {
                setQuery("");
                setFilter("all");
              }}
            >
              Tampilkan semua
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {visible.map((m) => {
            const isOpen = expanded === m.id;
            const busy = busyId === m.id;
            const unread = m.status === "new";
            return (
              <article
                key={m.id}
                className={`overflow-hidden rounded-xl border transition-colors ${
                  isOpen
                    ? "border-[var(--color-a-accent)]/50"
                    : unread
                      ? "border-[var(--color-a-accent)]/35 bg-[var(--color-a-accent)]/[0.035]"
                      : "border-[var(--color-a-line)] hover:border-[var(--color-a-line-2)]"
                }`}
              >
                <div className="flex flex-wrap items-start gap-3 p-3.5">
                  <button
                    type="button"
                    onClick={() => toggleExpand(m)}
                    aria-expanded={isOpen}
                    className="flex min-w-0 flex-1 items-start gap-3 text-left"
                  >
                    <span
                      aria-hidden="true"
                      className="text-display flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--color-a-line)] bg-[var(--color-a-surface-2)] a-meta text-[var(--color-a-dim)]"
                    >
                      {initialsOf(m.name)}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <p
                          className={`truncate text-sm ${
                            unread
                              ? "font-semibold text-[var(--color-a-text)]"
                              : "font-medium text-[var(--color-a-text)]"
                          }`}
                        >
                          {m.name}
                        </p>
                        <Chip tone={STATUS_TONE[m.status]}>
                          {STATUS_LABEL[m.status]}
                        </Chip>
                        {m.budget && (
                          <Chip tone="neutral">{m.budget}</Chip>
                        )}
                      </div>
                      <p className="a-data mt-1 truncate a-meta text-[var(--color-a-faint)]">
                        {m.email} · {formatWhen(m.created_at)}
                      </p>
                      {!isOpen && (
                        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[var(--color-a-dim)]">
                          {m.subject ? `${m.subject} — ` : ""}
                          {m.message}
                        </p>
                      )}
                    </div>
                  </button>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <a
                      href={mailtoReply(m)}
                      title="Balas lewat email"
                      aria-label={`Balas pesan dari ${m.name}`}
                      onClick={() => {
                        if (m.status === "new" || m.status === "read") {
                          void setStatus(m, "replied");
                        }
                      }}
                      className="a-btn a-btn-ghost"
                    >
                      Balas
                    </a>
                    <IconButton
                      icon={busy ? SpinnerIcon : TrashIcon}
                      label={`Hapus pesan dari ${m.name}`}
                      danger
                      disabled={busy}
                      onClick={() => remove(m)}
                    />
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-[var(--color-a-line)] p-4">
                    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                      {m.subject ? (
                        <p className="text-sm font-medium text-[var(--color-a-text)]">
                          {m.subject}
                        </p>
                      ) : (
                        <span />
                      )}
                      <p className="a-data a-meta text-[var(--color-a-faint)]">
                        {formatFull(m.created_at)}
                      </p>
                    </div>

                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--color-a-text)]">
                      {m.message}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--color-a-line)] pt-3.5">
                      <span className="a-key mr-1">Tandai</span>
                      {(
                        ["new", "read", "replied", "archived"] as ContactStatus[]
                      )
                        .filter((s) => s !== m.status)
                        .map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setStatus(m, s)}
                            disabled={busy}
                            className="a-btn a-btn-ghost"
                          >
                            {s === "replied" && (
                              <CheckIcon className="h-3.5 w-3.5" />
                            )}
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
