"use client";

import { useCallback, useEffect, useState } from "react";
import Field from "@/components/admin/Field";
import ReorderableRow from "@/components/admin/ReorderableRow";
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
  PlusIcon,
  PencilIcon,
  TrashIcon,
  QuoteIcon,
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

  const {
    dragHandlers,
    dragId,
    overId,
    saving: reordering,
    error: reorderError,
    moveBy,
  } = useReorder<Testimonial>("testimonials", items, setItems);

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

  function focusForm() {
    requestAnimationFrame(() =>
      document
        .getElementById("testimonial-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }

  function openNew() {
    setEditing(null);
    setForm({ ...EMPTY });
    setMessage(null);
    setShowForm(true);
    focusForm();
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
    focusForm();
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
      setMessage(`Gagal menyimpan: ${data.error ?? "terjadi kesalahan"}`);
    } else {
      setMessage(editing ? "Testimoni diperbarui." : "Testimoni ditambahkan.");
      setEditing(null);
      setShowForm(false);
      await load();
    }
    setSaving(false);
  }

  async function remove(x: Testimonial) {
    if (!confirm(`Hapus testimoni dari "${x.author}"? Tindakan ini permanen.`))
      return;
    const res = await fetch(
      `/api/testimonials?id=${encodeURIComponent(x.id)}`,
      { method: "DELETE" },
    );
    if (res.ok) {
      setItems((prev) => prev.filter((y) => y.id !== x.id));
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Gagal menghapus testimoni");
    }
  }

  const withoutAvatar = items.filter((x) => !x.avatar_url).length;

  return (
    <div>
      <PanelHeader
        title="Testimoni"
        description="Tampil sebagai grid di halaman utama. Selama daftar ini kosong, seksi tersebut tidak dirender di situs publik."
        meta={
          !loading && (
            <>
              <Chip tone="neutral">{items.length} kutipan</Chip>
              {withoutAvatar > 0 && (
                <Chip tone="warn">{withoutAvatar} tanpa foto</Chip>
              )}
            </>
          )
        }
        actions={
          <Button variant="primary" icon={PlusIcon} onClick={openNew}>
            Testimoni baru
          </Button>
        }
      />

      {error && <Notice tone="error">{error}</Notice>}
      {message && (
        <Notice
          tone={message.startsWith("Gagal") ? "error" : "ok"}
          onDismiss={() => setMessage(null)}
        >
          {message}
        </Notice>
      )}
      {reorderError && <Notice tone="error">{reorderError}</Notice>}

      {loading ? (
        <ListSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          icon={QuoteIcon}
          title="Belum ada testimoni"
          hint="Kutipan dari klien, atasan, atau rekan kerja. Sertakan nama dan perannya supaya kredibel."
          action={
            <Button variant="primary" icon={PlusIcon} onClick={openNew}>
              Testimoni baru
            </Button>
          }
        />
      ) : (
        <div className="mb-8">
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
                  className="h-10 w-10 shrink-0 rounded-full border border-[var(--color-a-line)] object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="text-display flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-a-line)] bg-[var(--color-a-surface-2)] text-xs text-[var(--color-a-dim)]"
                >
                  {initialsOf(x.author)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--color-a-text)]">
                  {x.author}
                  {(x.role || x.company) && (
                    <span className="ml-2 text-xs font-normal text-[var(--color-a-faint)]">
                      {[x.role, x.company].filter(Boolean).join(", ")}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 truncate text-xs italic text-[var(--color-a-dim)]">
                  {x.quote_en}
                </p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <IconButton
                  icon={PencilIcon}
                  label={`Edit testimoni dari ${x.author}`}
                  onClick={() => openEdit(x)}
                />
                <IconButton
                  icon={TrashIcon}
                  label={`Hapus testimoni dari ${x.author}`}
                  danger
                  disabled={reordering}
                  onClick={() => remove(x)}
                />
              </div>
            </ReorderableRow>
          ))}
        </div>
      )}

      {showForm && (
        <form
          id="testimonial-form"
          onSubmit={save}
          className="admin-fade-up a-panel scroll-mt-24 p-5 sm:p-6"
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-a-line)] pb-4">
            <h3 className="text-display text-lg uppercase text-[var(--color-a-text)]">
              {editing ? "Edit testimoni" : "Testimoni baru"}
            </h3>
            {editing && (
              <span className="a-data a-meta text-[var(--color-a-faint)]">
                {editing.id.slice(0, 8)}
              </span>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Field
                label="Kutipan (EN)"
                required
                textarea
                value={form.quote_en}
                onChange={(v) => setForm({ ...form, quote_en: v })}
                hint="Tulis apa adanya. Kutipan panjang lebih baik dipotong daripada diparafrase."
              />
            </div>
            <div className="md:col-span-2">
              <Field
                label="Kutipan (ID)"
                textarea
                value={form.quote_id}
                onChange={(v) => setForm({ ...form, quote_id: v })}
              />
            </div>

            <Field
              label="Nama"
              required
              value={form.author}
              onChange={(v) => setForm({ ...form, author: v })}
            />
            <Field
              label="Peran"
              value={form.role}
              onChange={(v) => setForm({ ...form, role: v })}
              placeholder="CTO, Dosen, Manajer Proyek…"
            />
            <Field
              label="Perusahaan / institusi"
              value={form.company}
              onChange={(v) => setForm({ ...form, company: v })}
            />
            <Field
              label="Tautan"
              type="url"
              value={form.link}
              onChange={(v) => setForm({ ...form, link: v })}
              placeholder="https://linkedin.com/in/…"
              hint="Profil pemberi kutipan — memperkuat kredibilitas."
            />
            <div className="md:col-span-2">
              <Field
                label="URL foto"
                type="url"
                value={form.avatar_url}
                onChange={(v) => setForm({ ...form, avatar_url: v })}
                placeholder="https://…"
                hint="Kosongkan untuk memakai inisial nama secara otomatis."
              />
            </div>
            <div className="w-32">
              <Field
                label="Urutan"
                type="number"
                value={form.sort_order}
                onChange={(v) => setForm({ ...form, sort_order: v })}
                hint="Angka kecil tampil lebih dulu."
              />
            </div>
          </div>

          <FormActions>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? "Menyimpan…" : "Simpan testimoni"}
            </Button>
            <Button
              variant="quiet"
              onClick={() => {
                setShowForm(false);
                setEditing(null);
              }}
            >
              Batal
            </Button>
          </FormActions>
        </form>
      )}
    </div>
  );
}
