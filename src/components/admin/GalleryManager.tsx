"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import ImageUpload from "@/components/admin/ImageUpload";
import Field from "@/components/admin/Field";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  InboxIcon,
  GripIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@/components/admin/icons";
import { useReorder } from "@/lib/use-reorder";
import type { GalleryPhoto } from "@/types";

const isPdf = (url: string) => {
  const q = url.split("?")[0].toLowerCase();
  return q.endsWith(".pdf") || url.toLowerCase().startsWith("data:application/pdf");
};

const EMPTY = {
  title_en: "",
  title_id: "",
  alt_text: "",
  category: "general",
  sort_order: "0",
  image_url: "",
};

export default function GalleryManager() {
  const supabase = createSupabaseBrowser();
  const [items, setItems] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GalleryPhoto | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { dragHandlers, dragId, overId, saving: reordering, error: reorderError, moveBy } =
    useReorder<GalleryPhoto>("gallery_photos", items, setItems);

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

  function openNew() {
    setEditing(null);
    setForm({ ...EMPTY });
    setMessage(null);
    setShowForm(true);
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
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (!form.image_url) {
      setMessage("Error: please upload an image first");
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
      setMessage(`Error: ${data.error ?? "Gagal menyimpan"}`);
    } else {
      setMessage(editing ? "Photo updated ✓" : "Photo added ✓");
      setEditing(null);
      setShowForm(false);
      await load();
    }
    setSaving(false);
  }

  async function remove(g: GalleryPhoto) {
    if (!confirm("Delete this photo?")) return;
    const res = await fetch(`/api/gallery/${g.id}`, { method: "DELETE" });
    if (res.ok) await load();
  }

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-gray-500">Library</p>
          <h2 className="text-display text-2xl uppercase text-white">Gallery</h2>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition-colors duration-300 hover:bg-accent-soft active:scale-[0.98]"
        >
          <PlusIcon />
          Add photo
        </button>
      </div>

      {message && (
        <p className="mb-4 border-l-2 border-accent px-3 py-2 text-sm text-gray-300">
          {message}
        </p>
      )}

      {reorderError && (
        <p className="mb-4 border-l-2 border-red-500 px-3 py-2 text-sm text-red-300">
          {reorderError}
        </p>
      )}

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : items.length === 0 ? (
        <div className="mb-8 flex flex-col items-center gap-3 border-y border-white/10 py-14 text-center">
          <InboxIcon className="text-gray-600" />
          <p className="text-sm text-gray-500">No photos yet.</p>
        </div>
      ) : (
        <div className="admin-list mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((g, i) => (
            <div
              key={g.id}
              {...dragHandlers(i)}
              className={`relative overflow-hidden border transition-colors duration-300 ${
                dragId === g.id
                  ? "border-accent/60 opacity-50"
                  : overId === g.id && dragId !== g.id
                    ? "border-accent bg-accent/[0.04]"
                    : "border-white/10 hover:border-accent/40"
              }`}
            >
              {/* Handle geser — kartu galeri tidak punya baris, jadi handle
                  ditempel di pojok atas gambar. */}
              <span
                aria-hidden="true"
                title="Geser untuk mengubah urutan"
                className="absolute left-2 top-2 z-10 flex h-8 w-8 cursor-grab items-center justify-center rounded-md border border-white/20 bg-black/60 text-gray-300 backdrop-blur-sm transition-colors hover:border-accent hover:text-accent active:cursor-grabbing"
              >
                <GripIcon />
              </span>

              {/* Kontrol keyboard / sentuh, sejajar handle */}
              <div className="absolute right-2 top-2 z-10 flex gap-1">
                <button
                  type="button"
                  onClick={() => moveBy(g.id, -1)}
                  disabled={i === 0 || reordering}
                  aria-label={`Pindahkan ke atas (posisi ${i + 1} dari ${items.length})`}
                  title="Naik"
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-white/20 bg-black/60 text-gray-300 backdrop-blur-sm transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronUpIcon className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveBy(g.id, 1)}
                  disabled={i === items.length - 1 || reordering}
                  aria-label={`Pindahkan ke bawah (posisi ${i + 1} dari ${items.length})`}
                  title="Turun"
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-white/20 bg-black/60 text-gray-300 backdrop-blur-sm transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronDownIcon className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="aspect-[4/3] w-full overflow-hidden bg-black/40">
                {isPdf(g.image_url) ? (
                  <a
                    href={g.image_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-full w-full flex-col items-center justify-center gap-1 text-accent hover:bg-white/5"
                  >
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6" />
                      <path d="M12 18v-6" />
                      <path d="M9 15h6" />
                    </svg>
                    <span className="text-[10px] uppercase tracking-widest text-gray-300">
                      PDF
                    </span>
                  </a>
                ) : (
                   
                  <img src={g.image_url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex items-center justify-between gap-2 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-white">{g.title_en || "—"}</p>
                  <p className="truncate text-xs text-gray-500">{g.category}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => openEdit(g)}
                    aria-label={g.title_en ? `Edit ${g.title_en}` : "Edit photo"}
                    title="Edit"
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-white transition-colors duration-300 hover:border-accent hover:text-accent active:scale-[0.98]"
                  >
                    <PencilIcon />
                  </button>
                  <button
                    onClick={() => remove(g)}
                    aria-label={g.title_en ? `Delete ${g.title_en}` : "Delete photo"}
                    title="Delete"
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-gray-400 transition-colors duration-300 hover:border-red-500 hover:text-red-400 active:scale-[0.98]"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <form onSubmit={save} className="admin-fade-up border-y border-white/10 py-7">
          <h3 className="mb-5 text-lg font-semibold text-white">
            {editing ? "Edit photo" : "New photo"}
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <ImageUpload
                folder="gallery"
                value={form.image_url || null}
                onChange={(url) => setForm({ ...form, image_url: url })}
                label="Photo"
              />
            </div>
            <Field label="Title (EN)" value={form.title_en} onChange={(v) => setForm({ ...form, title_en: v })} />
            <Field label="Title (ID)" value={form.title_id} onChange={(v) => setForm({ ...form, title_id: v })} />
            <div className="md:col-span-2">
              <Field
                label="Image alt text"
                value={form.alt_text}
                onChange={(v) => setForm({ ...form, alt_text: v })}
                placeholder="Describe the photo for screen readers"
              />
            </div>
            <div>
              <Field
                label="Category"
                value={form.category}
                onChange={(v) => setForm({ ...form, category: v })}
                list="gallery-categories"
              />
              {/* Saran nilai; admin tetap bisa mengetik kategori baru.
                  Kategori yang belum terdaftar tampil apa adanya di publik. */}
              <datalist id="gallery-categories">
                <option value="general" />
                <option value="event" />
                <option value="campus" />
                <option value="work" />
                <option value="personal" />
              </datalist>
              <p className="mt-1.5 text-[11px] leading-relaxed text-gray-500">
                Dipakai untuk filter kategori di halaman galeri publik.
              </p>
            </div>
            <Field label="Sort order" value={form.sort_order} onChange={(v) => setForm({ ...form, sort_order: v })} />
          </div>
          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-accent px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-black transition-colors duration-300 hover:bg-accent-soft active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-md border border-white/15 px-6 py-2.5 text-xs text-gray-300 transition-colors duration-300 hover:border-white/30 hover:text-white active:scale-[0.98]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
