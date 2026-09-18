"use client";

import { useCallback, useEffect, useState } from "react";
import Field from "@/components/admin/Field";
import ReorderableRow from "@/components/admin/ReorderableRow";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  InboxIcon,
  RefreshIcon,
  SpinnerIcon,
} from "@/components/admin/icons";
import { useReorder } from "@/lib/use-reorder";
import type { Testimonial } from "@/types";

const EMPTY = {
  quote_en: "",
  quote_id: "",
  author: "",
  role: "",
  company: "",
  avatar_url: "",
  link: "",
  sort_order: "0",
};

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function TestimonialsManager() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { dragHandlers, dragId, overId, saving: reordering, moveBy } =
    useReorder<Testimonial>("testimonials", items, setItems);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/testimonials", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Gagal memuat testimoni");
        setItems([]);
      } else {
        setItems((data?.items as Testimonial[]) ?? []);
      }
    } catch {
      setError("Gagal memuat testimoni");
      setItems([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openNew() {
    setEditing(null);
    setForm({ ...EMPTY });
    setMessage(null);
    setShowForm(true);
  }

  function openEdit(x: Testimonial) {
    setEditing(x);
    setForm({
      quote_en: x.quote_en,
      quote_id: x.quote_id ?? "",
      author: x.author,
      role: x.role ?? "",
      company: x.company ?? "",
      avatar_url: x.avatar_url ?? "",
      link: x.link ?? "",
      sort_order: String(x.sort_order),
    });
    setMessage(null);
    setShowForm(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const payload = {
      ...form,
      sort_order: Number(form.sort_order) || 0,
      ...(editing ? { id: editing.id } : {}),
    };

    const res = await fetch("/api/testimonials", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(`Error: ${data.error ?? "Gagal menyimpan"}`);
    } else {
      setMessage(editing ? "Testimoni diperbarui ✓" : "Testimoni ditambahkan ✓");
      setEditing(null);
      setShowForm(false);
      await load();
    }
    setSaving(false);
  }

  async function remove(x: Testimonial) {
    if (!confirm(`Hapus testimoni dari "${x.author}"?`)) return;
    const res = await fetch(
      `/api/testimonials?id=${encodeURIComponent(x.id)}`,
      { method: "DELETE" },
    );
    if (res.ok) {
      setItems((prev) => prev.filter((y) => y.id !== x.id));
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Gagal menghapus");
    }
  }

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-gray-500">
            Konten
          </p>
          <h2 className="text-display flex items-center gap-3 text-2xl uppercase text-white">
            Testimonials
            <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs font-normal tracking-normal text-accent">
              {loading ? "…" : items.length}
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            aria-label="Muat ulang"
            title="Muat ulang"
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-gray-300 transition-colors duration-300 hover:border-accent hover:text-accent active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <SpinnerIcon /> : <RefreshIcon />}
          </button>
          <button
            onClick={openNew}
            className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition-colors duration-300 hover:bg-accent-soft active:scale-[0.98]"
          >
            <PlusIcon />
            Tambah
          </button>
        </div>
      </div>

      <p className="mb-6 max-w-2xl text-sm leading-relaxed text-gray-500">
        Tampil sebagai grid di halaman utama. Kalau kosong, seksi ini tidak
        dirender sama sekali di situs publik.
      </p>

      {error && (
        <p className="mb-4 border-l-2 border-red-500 px-3 py-2 text-sm text-red-300">
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
      ) : items.length === 0 ? (
        <div className="mb-8 flex flex-col items-center gap-3 border-y border-white/10 py-14 text-center">
          <InboxIcon className="text-gray-600" />
          <p className="text-sm text-gray-500">Belum ada testimoni.</p>
        </div>
      ) : (
        <div className="admin-list mb-8">
          {items.map((x, i) => (
            <ReorderableRow
              key={x.id}
              index={i}
              total={items.length}
              dragging={dragId === x.id}
              dropTarget={overId === x.id && dragId !== x.id}
              saving={reordering}
              dragProps={dragHandlers(i)}
              onMoveUp={() => moveBy(x.id, -1)}
              onMoveDown={() => moveBy(x.id, 1)}
            >
              {x.avatar_url ? (
                 
                <img
                  src={x.avatar_url}
                  alt=""
                  className="h-11 w-11 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="text-display flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs text-accent"
                >
                  {initialsOf(x.author)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {x.author}
                  {(x.role || x.company) && (
                    <span className="ml-2 text-xs font-normal text-gray-500">
                      {[x.role, x.company].filter(Boolean).join(", ")}
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-gray-500">{x.quote_en}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => openEdit(x)}
                  aria-label={`Edit testimoni dari ${x.author}`}
                  title="Edit"
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-white transition-colors duration-300 hover:border-accent hover:text-accent active:scale-[0.98]"
                >
                  <PencilIcon />
                </button>
                <button
                  onClick={() => remove(x)}
                  disabled={reordering}
                  aria-label={`Hapus testimoni dari ${x.author}`}
                  title="Hapus"
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-gray-400 transition-colors duration-300 hover:border-red-500 hover:text-red-400 active:scale-[0.98] disabled:opacity-50"
                >
                  <TrashIcon />
                </button>
              </div>
            </ReorderableRow>
          ))}
        </div>
      )}

      {showForm && (
        <form onSubmit={save} className="admin-fade-up border-y border-white/10 py-7">
          <h3 className="mb-5 text-lg font-semibold text-white">
            {editing ? "Edit testimoni" : "Testimoni baru"}
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Field label="Quote (EN)" required textarea value={form.quote_en} onChange={(v) => setForm({ ...form, quote_en: v })} />
            </div>
            <div className="md:col-span-2">
              <Field label="Quote (ID)" textarea value={form.quote_id} onChange={(v) => setForm({ ...form, quote_id: v })} />
            </div>
            <Field label="Author" required value={form.author} onChange={(v) => setForm({ ...form, author: v })} />
            <Field label="Role" value={form.role} onChange={(v) => setForm({ ...form, role: v })} placeholder="CTO" />
            <Field label="Company" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
            <Field label="Link (URL)" value={form.link} onChange={(v) => setForm({ ...form, link: v })} />
            <div className="md:col-span-2">
              <Field
                label="Avatar URL"
                value={form.avatar_url}
                onChange={(v) => setForm({ ...form, avatar_url: v })}
                placeholder="https://… (kosong = inisial otomatis)"
              />
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-accent px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-black transition-colors duration-300 hover:bg-accent-soft active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Menyimpan…" : "Simpan"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-md border border-white/15 px-6 py-2.5 text-xs text-gray-300 transition-colors duration-300 hover:border-white/30 hover:text-white active:scale-[0.98]"
            >
              Batal
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
