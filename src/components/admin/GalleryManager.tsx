"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import ImageUpload from "@/components/admin/ImageUpload";
import Field from "@/components/admin/Field";
import {
  Button,
  CardsSkeleton,
  Chip,
  EmptyState,
  FormActions,
  IconButton,
  Notice,
  PanelHeader,
  SegmentedFilter,
} from "@/components/admin/ui";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ImageIcon,
  GripIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@/components/admin/icons";
import { useReorder } from "@/lib/use-reorder";
import type { GalleryPhoto } from "@/types";

const isPdf = (url: string) => {
  const q = url.split("?")[0].toLowerCase();
  return (
    q.endsWith(".pdf") || url.toLowerCase().startsWith("data:application/pdf")
  );
};

const EMPTY = {
  title_en: "",
  title_id: "",
  alt_text: "",
  category: "general",
  sort_order: "0",
  image_url: "",
};

const CATEGORY_SUGGESTIONS = ["general", "event", "campus", "work", "personal"];

export default function GalleryManager() {
  const supabase = createSupabaseBrowser();
  const [items, setItems] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GalleryPhoto | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const {
    dragHandlers,
    dragId,
    overId,
    saving: reordering,
    error: reorderError,
    moveBy,
  } = useReorder<GalleryPhoto>("gallery_photos", items, setItems);

  async function load() {
    const { data } = await supabase
      .from("gallery_photos")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    setItems((data as GalleryPhoto[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(() => {
    const set = new Set(items.map((g) => g.category).filter(Boolean));
    return Array.from(set).sort();
  }, [items]);

  const visible = useMemo(
    () =>
      categoryFilter === "all"
        ? items
        : items.filter((g) => g.category === categoryFilter),
    [items, categoryFilter],
  );

  function openNew() {
    setEditing(null);
    setForm({ ...EMPTY });
    setMessage(null);
    setShowForm(true);
    requestAnimationFrame(() =>
      document
        .getElementById("gallery-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }

  function openEdit(g: GalleryPhoto) {
    setEditing(g);
    setForm({
      title_en: g.title_en ?? "",
      title_id: g.title_id ?? "",
      alt_text: g.alt_text ?? "",
      category: g.category,
      sort_order: String(g.sort_order),
      image_url: g.image_url,
    });
    setMessage(null);
    setShowForm(true);
    requestAnimationFrame(() =>
      document
        .getElementById("gallery-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (!form.image_url) {
      setMessage("Gagal menyimpan: unggah berkas terlebih dahulu.");
      setSaving(false);
      return;
    }

    const payload = {
      title_en: form.title_en || null,
      title_id: form.title_id || null,
      alt_text: form.alt_text || null,
      category: form.category || "general",
      image_url: form.image_url,
      sort_order: Number(form.sort_order) || 0,
    };

    let res: Response;
    if (editing) {
      res = await fetch(`/api/gallery/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(`Gagal menyimpan: ${data.error ?? "terjadi kesalahan"}`);
    } else {
      setMessage(editing ? "Foto diperbarui." : "Foto ditambahkan.");
      setEditing(null);
      setShowForm(false);
      await load();
    }
    setSaving(false);
  }

  async function remove(g: GalleryPhoto) {
    const label = g.title_en ? `"${g.title_en}"` : "foto ini";
    if (!confirm(`Hapus ${label}? Tindakan ini permanen.`)) return;
    const res = await fetch(`/api/gallery/${g.id}`, { method: "DELETE" });
    if (res.ok) await load();
    else setMessage("Gagal menghapus foto.");
  }

  const withoutAlt = items.filter((g) => !g.alt_text).length;

  return (
    <div>
      <PanelHeader
        title="Galeri"
        description="Kumpulan foto yang tampil di halaman galeri publik. Kategori di sini menjadi filter di halaman tersebut."
        meta={
          !loading && (
            <>
              <Chip tone="neutral">{items.length} foto</Chip>
              {withoutAlt > 0 && (
                <Chip tone="warn">{withoutAlt} tanpa teks alternatif</Chip>
              )}
            </>
          )
        }
        actions={
          <Button variant="primary" icon={PlusIcon} onClick={openNew}>
            Unggah foto
          </Button>
        }
      />

      {message && (
        <Notice
          tone={message.startsWith("Gagal") ? "error" : "ok"}
          onDismiss={() => setMessage(null)}
        >
          {message}
        </Notice>
      )}
      {reorderError && <Notice tone="error">{reorderError}</Notice>}

      {!loading && categories.length > 1 && (
        <div className="mb-5">
          <SegmentedFilter
            label="Filter kategori"
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={[
              { key: "all", label: "Semua", count: items.length },
              ...categories.map((cat) => ({
                key: cat,
                label: cat,
                count: items.filter((g) => g.category === cat).length,
              })),
            ]}
          />
        </div>
      )}

      {loading ? (
        <CardsSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="Galeri masih kosong"
          hint="Unggah foto pertama untuk mulai mengisi halaman galeri."
          action={
            <Button variant="primary" icon={PlusIcon} onClick={openNew}>
              Unggah foto
            </Button>
          }
        />
      ) : (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((g) => {
            const realIndex = items.findIndex((x) => x.id === g.id);
            const dragging = dragId === g.id;
            const dropTarget = overId === g.id && dragId !== g.id;
            return (
              <article
                key={g.id}
                {...dragHandlers(realIndex)}
                className={`group/card relative overflow-hidden rounded-xl border transition-colors ${
                  dragging
                    ? "border-[var(--color-a-accent)]/60 opacity-60"
                    : dropTarget
                      ? "border-[var(--color-a-accent)] bg-[var(--color-a-accent)]/[0.06]"
                      : "border-[var(--color-a-line)] hover:border-[var(--color-a-line-2)]"
                }`}
              >
                {/* Kendali mengapung di atas gambar. Disembunyikan sampai
                    hover/fokus supaya foto jadi fokus utama kartu — tetapi
                    tetap ada saat difokus keyboard (focus-within). */}
                <div className="absolute inset-x-2 top-2 z-10 flex items-start justify-between gap-1 opacity-0 transition-opacity group-hover/card:opacity-100 group-focus-within/card:opacity-100">
                  <span
                    aria-hidden="true"
                    title="Geser untuk mengubah urutan"
                    className="flex h-8 w-8 cursor-grab items-center justify-center rounded-md border border-white/20 bg-black/65 text-white/80 backdrop-blur-sm transition-colors hover:text-white active:cursor-grabbing"
                  >
                    <GripIcon className="h-4 w-4" />
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveBy(g.id, -1)}
                      disabled={realIndex === 0 || reordering}
                      aria-label={`Naikkan ke posisi ${realIndex} dari ${items.length}`}
                      title="Naik"
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-white/20 bg-black/65 text-white/80 backdrop-blur-sm transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ChevronUpIcon className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveBy(g.id, 1)}
                      disabled={realIndex === items.length - 1 || reordering}
                      aria-label={`Turunkan ke posisi ${realIndex + 2} dari ${items.length}`}
                      title="Turun"
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-white/20 bg-black/65 text-white/80 backdrop-blur-sm transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ChevronDownIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--color-a-surface-2)]">
                  {isPdf(g.image_url) ? (
                    <a
                      href={g.image_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-[var(--color-a-accent)] transition-colors hover:bg-[var(--color-a-surface)]"
                    >
                      <svg
                        width="26"
                        height="26"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <path d="M14 2v6h6" />
                        <path d="M12 18v-6" />
                        <path d="M9 15h6" />
                      </svg>
                      <span className="a-key a-micro">PDF</span>
                    </a>
                  ) : (
                    <img
                      src={g.image_url}
                      alt={g.alt_text || g.title_en || ""}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-[1.03]"
                    />
                  )}
                </div>

                <div className="flex items-start justify-between gap-2 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-[var(--color-a-text)]">
                      {g.title_en || (
                        <span className="text-[var(--color-a-faint)]">
                          Tanpa judul
                        </span>
                      )}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <Chip tone="neutral">{g.category}</Chip>
                      {!g.alt_text && <Chip tone="warn">tanpa alt</Chip>}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <IconButton
                      icon={PencilIcon}
                      label={g.title_en ? `Edit ${g.title_en}` : "Edit foto"}
                      onClick={() => openEdit(g)}
                    />
                    <IconButton
                      icon={TrashIcon}
                      label={g.title_en ? `Hapus ${g.title_en}` : "Hapus foto"}
                      danger
                      onClick={() => remove(g)}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {showForm && (
        <form
          id="gallery-form"
          onSubmit={save}
          className="admin-fade-up a-panel scroll-mt-24 p-5 sm:p-6"
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-a-line)] pb-4">
            <h3 className="text-display text-lg uppercase text-[var(--color-a-text)]">
              {editing ? "Edit foto" : "Foto baru"}
            </h3>
            {editing && (
              <span className="a-data a-meta text-[var(--color-a-faint)]">
                {editing.id.slice(0, 8)}
              </span>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <ImageUpload
                folder="gallery"
                value={form.image_url || null}
                onChange={(url) => setForm({ ...form, image_url: url })}
                label="Foto"
              />
            </div>

            <Field
              label="Judul (EN)"
              value={form.title_en}
              onChange={(v) => setForm({ ...form, title_en: v })}
            />
            <Field
              label="Judul (ID)"
              value={form.title_id}
              onChange={(v) => setForm({ ...form, title_id: v })}
            />

            <div className="md:col-span-2">
              <Field
                label="Teks alternatif gambar"
                value={form.alt_text}
                onChange={(v) => setForm({ ...form, alt_text: v })}
                placeholder="Jelaskan isi foto untuk pembaca layar"
                hint="Wajib secara aksesibilitas untuk foto bermakna. Lewati hanya bila foto murni dekoratif."
              />
            </div>

            <Field
              label="Kategori"
              value={form.category}
              onChange={(v) => setForm({ ...form, category: v })}
              list="gallery-categories"
              hint="Menjadi filter di halaman galeri publik. Kategori baru bisa diketik bebas."
            />
            {/* Saran nilai; admin tetap bisa mengetik kategori baru.
                Kategori yang belum terdaftar tampil apa adanya di publik. */}
            <datalist id="gallery-categories">
              {CATEGORY_SUGGESTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>

            <Field
              label="Urutan"
              type="number"
              value={form.sort_order}
              onChange={(v) => setForm({ ...form, sort_order: v })}
              hint="Angka kecil tampil lebih dulu."
            />
          </div>

          <FormActions>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? "Menyimpan…" : "Simpan foto"}
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
