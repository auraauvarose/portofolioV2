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
  BriefcaseIcon,
} from "@/components/admin/icons";
import { useReorder } from "@/lib/use-reorder";
import type { Experience } from "@/types";

const EMPTY = {
  role_en: "",
  role_id: "",
  company: "",
  location: "",
  period: "",
  current: false,
  description_en: "",
  description_id: "",
  sort_order: "0",
};

export default function ExperienceManager() {
  const [items, setItems] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Experience | null>(null);
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
  } = useReorder<Experience>("experience", items, setItems);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/experience", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Gagal memuat pengalaman");
        setItems([]);
      } else {
        setItems((data?.items as Experience[]) ?? []);
      }
    } catch {
      setError("Gagal memuat pengalaman");
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
        .getElementById("exp-form")
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

  function openEdit(x: Experience) {
    setEditing(x);
    setForm({
      role_en: x.role_en,
      role_id: x.role_id,
      company: x.company,
      location: x.location ?? "",
      period: x.period ?? "",
      current: x.current,
      description_en: x.description_en ?? "",
      description_id: x.description_id ?? "",
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

    const res = await fetch("/api/experience", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(`Gagal menyimpan: ${data.error ?? "terjadi kesalahan"}`);
    } else {
      setMessage(editing ? "Pengalaman diperbarui." : "Pengalaman ditambahkan.");
      setEditing(null);
      setShowForm(false);
      await load();
    }
    setSaving(false);
  }

  async function remove(x: Experience) {
    if (!confirm(`Hapus "${x.role_en}" di ${x.company}? Tindakan ini permanen.`))
      return;
    const res = await fetch(`/api/experience?id=${encodeURIComponent(x.id)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setItems((prev) => prev.filter((y) => y.id !== x.id));
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Gagal menghapus pengalaman");
    }
  }

  const currentCount = items.filter((x) => x.current).length;

  return (
    <div>
      <PanelHeader
        title="Pengalaman"
        description="Tampil sebagai timeline di halaman utama. Selama daftar ini kosong, seksi tersebut tidak dirender di situs publik."
        meta={
          !loading && (
            <>
              <Chip tone="neutral">{items.length} entri</Chip>
              {currentCount > 0 && (
                <Chip tone="accent">{currentCount} berjalan</Chip>
              )}
            </>
          )
        }
        actions={
          <Button variant="primary" icon={PlusIcon} onClick={openNew}>
            Pengalaman baru
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
          icon={BriefcaseIcon}
          title="Belum ada pengalaman"
          hint="Tambahkan riwayat kerja atau magang. Entri teratas tampil paling awal di timeline."
          action={
            <Button variant="primary" icon={PlusIcon} onClick={openNew}>
              Pengalaman baru
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
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="truncate text-sm font-medium text-[var(--color-a-text)]">
                    {x.role_en}
                  </p>
                  {x.current && <Chip tone="accent">sekarang</Chip>}
                </div>
                <p className="a-data mt-0.5 truncate a-meta text-[var(--color-a-faint)]">
                  {[x.company, x.period, x.location]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <IconButton
                  icon={PencilIcon}
                  label={`Edit ${x.role_en}`}
                  onClick={() => openEdit(x)}
                />
                <IconButton
                  icon={TrashIcon}
                  label={`Hapus ${x.role_en}`}
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
          id="exp-form"
          onSubmit={save}
          className="admin-fade-up a-panel scroll-mt-24 p-5 sm:p-6"
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-a-line)] pb-4">
            <h3 className="text-display text-lg uppercase text-[var(--color-a-text)]">
              {editing ? "Edit pengalaman" : "Pengalaman baru"}
            </h3>
            {editing && (
              <span className="a-data a-meta text-[var(--color-a-faint)]">
                {editing.id.slice(0, 8)}
              </span>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Posisi (EN)"
              required
              value={form.role_en}
              onChange={(v) => setForm({ ...form, role_en: v })}
            />
            <Field
              label="Posisi (ID)"
              value={form.role_id}
              onChange={(v) => setForm({ ...form, role_id: v })}
              hint="Kosongkan untuk memakai versi Inggris."
            />
            <Field
              label="Perusahaan"
              required
              value={form.company}
              onChange={(v) => setForm({ ...form, company: v })}
            />
            <Field
              label="Lokasi"
              value={form.location}
              onChange={(v) => setForm({ ...form, location: v })}
              placeholder="Jakarta, Indonesia"
            />
            <Field
              label="Periode"
              value={form.period}
              onChange={(v) => setForm({ ...form, period: v })}
              placeholder="Jan 2024 — Sekarang"
              hint="Teks bebas — ditampilkan apa adanya di timeline."
            />
            <div className="flex items-end pb-1">
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[var(--color-a-text)]">
                <input
                  type="checkbox"
                  checked={form.current}
                  onChange={(e) =>
                    setForm({ ...form, current: e.target.checked })
                  }
                  className="h-4 w-4 accent-[var(--color-a-accent)]"
                />
                Masih berjalan
              </label>
            </div>

            <div className="md:col-span-2">
              <Field
                label="Deskripsi (EN)"
                textarea
                value={form.description_en}
                onChange={(v) => setForm({ ...form, description_en: v })}
              />
            </div>
            <div className="md:col-span-2">
              <Field
                label="Deskripsi (ID)"
                textarea
                value={form.description_id}
                onChange={(v) => setForm({ ...form, description_id: v })}
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
              {saving ? "Menyimpan…" : "Simpan pengalaman"}
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
