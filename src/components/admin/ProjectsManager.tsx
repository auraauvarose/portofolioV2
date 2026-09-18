"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import ImageUpload from "@/components/admin/ImageUpload";
import Field from "@/components/admin/Field";
import FileThumb from "@/components/admin/FileThumb";
import ReorderableRow from "@/components/admin/ReorderableRow";
import { useReorder } from "@/lib/use-reorder";
import { PlusIcon, PencilIcon, TrashIcon, InboxIcon } from "@/components/admin/icons";
import type { Project } from "@/types";

const EMPTY = {
  title_en: "",
  title_id: "",
  description_en: "",
  description_id: "",
  category: "professional",
  year: "",
  link: "",
  repo_url: "",
  alt_text: "",
  slug: "",
  content_en: "",
  content_id: "",
  tech_stack: "",
  sort_order: "0",
  featured: true,
  image_url: "",
};

export default function ProjectsManager() {
  const supabase = createSupabaseBrowser();
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { dragHandlers, dragId, overId, saving: reordering, error: reorderError, moveBy } =
    useReorder<Project>("projects", items, setItems);

  async function load() {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .order("sort_order", { ascending: true })
      // Tiebreaker sama dengan urutan publik (src/lib/data.ts) supaya daftar
      // di admin persis mencerminkan yang dilihat pengunjung.
      .order("created_at", { ascending: false });
    setItems((data as Project[]) ?? []);
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

  function openEdit(p: Project) {
    setEditing(p);
    setForm({
      title_en: p.title_en,
      title_id: p.title_id,
      description_en: p.description_en ?? "",
      description_id: p.description_id ?? "",
      category: p.category,
      year: p.year ?? "",
      link: p.link ?? "",
      repo_url: p.repo_url ?? "",
      alt_text: p.alt_text ?? "",
      slug: p.slug ?? "",
      content_en: p.content_en ?? "",
      content_id: p.content_id ?? "",
      tech_stack: p.tech_stack.join(", "),
      sort_order: String(p.sort_order),
      featured: p.featured,
      image_url: p.image_url ?? "",
    });
    setMessage(null);
    setShowForm(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const payload = {
      title_en: form.title_en,
      title_id: form.title_id || form.title_en,
      description_en: form.description_en || null,
      description_id: form.description_id || null,
      category: form.category,
      year: form.year || null,
      link: form.link || null,
      repo_url: form.repo_url || null,
      alt_text: form.alt_text || null,
      slug: form.slug || null,
      content_en: form.content_en || null,
      content_id: form.content_id || null,
      image_url: form.image_url || null,
      tech_stack: form.tech_stack
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      sort_order: Number(form.sort_order) || 0,
      featured: form.featured,
    };

    let res: Response;
    if (editing) {
      res = await fetch(`/api/projects/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(`Error: ${data.error ?? "Gagal menyimpan"}`);
    } else {
      setMessage(editing ? "Project updated ✓" : "Project created ✓");
      setEditing(null);
      setShowForm(false);
      await load();
    }
    setSaving(false);
  }

  async function remove(p: Project) {
    if (!confirm(`Delete "${p.title_en}"?`)) return;
    const res = await fetch(`/api/projects/${p.id}`, { method: "DELETE" });
    if (res.ok) await load();
  }

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-gray-500">Library</p>
          <h2 className="text-display text-2xl uppercase text-white">Projects</h2>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition-colors duration-300 hover:bg-accent-soft active:scale-[0.98]"
        >
          <PlusIcon />
          Add project
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
          <p className="text-sm text-gray-500">No projects yet.</p>
        </div>
      ) : (
        <div className="admin-list mb-8 space-y-0">
          {items.map((p, i) => (
            <ReorderableRow
              key={p.id}
              index={i}
              total={items.length}
              dragging={dragId === p.id}
              dropTarget={overId === p.id && dragId !== p.id}
              saving={reordering}
              dragProps={dragHandlers(i)}
              onMoveUp={() => moveBy(p.id, -1)}
              onMoveDown={() => moveBy(p.id, 1)}
            >
              <FileThumb url={p.image_url} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-white">{p.title_en}</p>
                <p className="truncate text-xs text-gray-500">
                  {p.category} · {p.year}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => openEdit(p)}
                  aria-label={`Edit ${p.title_en}`}
                  title="Edit"
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-white transition-colors duration-300 hover:border-accent hover:text-accent active:scale-[0.98]"
                >
                  <PencilIcon />
                </button>
                <button
                  onClick={() => remove(p)}
                  aria-label={`Delete ${p.title_en}`}
                  title="Delete"
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-gray-400 transition-colors duration-300 hover:border-red-500 hover:text-red-400 active:scale-[0.98]"
                >
                  <TrashIcon />
                </button>
              </div>
            </ReorderableRow>
          ))}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={save}
          className="admin-fade-up border-y border-white/10 py-7"
        >
          <h3 className="mb-5 text-lg font-semibold text-white">
            {editing ? "Edit project" : "New project"}
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title (EN)" required value={form.title_en} onChange={(v) => setForm({ ...form, title_en: v })} />
            <Field label="Title (ID)" value={form.title_id} onChange={(v) => setForm({ ...form, title_id: v })} />
            <Field label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
            <Field label="Year" value={form.year} onChange={(v) => setForm({ ...form, year: v })} />
            <Field label="Link (URL)" value={form.link} onChange={(v) => setForm({ ...form, link: v })} />
            <Field label="Repository (URL)" value={form.repo_url} onChange={(v) => setForm({ ...form, repo_url: v })} />
            <Field label="Tech stack (comma separated)" value={form.tech_stack} onChange={(v) => setForm({ ...form, tech_stack: v })} />
            <div>
              <Field
                label="Slug (case study URL)"
                value={form.slug}
                onChange={(v) => setForm({ ...form, slug: v })}
                placeholder="my-project-name"
              />
              <p className="mt-1.5 text-[11px] leading-relaxed text-gray-500">
                Huruf kecil, angka, dan tanda hubung. Kosongkan bila belum ingin
                halaman case study. URL:{" "}
                <code className="text-accent">
                  /work/{form.slug || "slug-kamu"}
                </code>
              </p>
            </div>
            <div className="md:col-span-2">
              <Field label="Description (EN)" textarea value={form.description_en} onChange={(v) => setForm({ ...form, description_en: v })} />
            </div>
            <div className="md:col-span-2">
              <Field label="Description (ID)" textarea value={form.description_id} onChange={(v) => setForm({ ...form, description_id: v })} />
            </div>
            <div className="md:col-span-2">
              <Field
                label="Case study content (EN)"
                textarea
                value={form.content_en}
                onChange={(v) => setForm({ ...form, content_en: v })}
              />
              <p className="mt-1.5 text-[11px] leading-relaxed text-gray-500">
                Isi halaman <code className="text-accent">/work/{form.slug || "slug"}</code>.
                Pisahkan paragraf dengan satu baris kosong. Kosongkan untuk
                memakai Description (EN).
              </p>
            </div>
            <div className="md:col-span-2">
              <Field
                label="Case study content (ID)"
                textarea
                value={form.content_id}
                onChange={(v) => setForm({ ...form, content_id: v })}
              />
            </div>
            <div className="md:col-span-2">
              <Field
                label="Image alt text"
                value={form.alt_text}
                onChange={(v) => setForm({ ...form, alt_text: v })}
                placeholder="Describe the image for screen readers"
              />
            </div>
            <div className="md:col-span-2">
              <ImageUpload
                folder="projects"
                value={form.image_url || null}
                onChange={(url) => setForm({ ...form, image_url: url })}
                label="Project image"
              />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  className="accent-accent"
                />
                Featured
              </label>
              <Field label="Sort order" value={form.sort_order} onChange={(v) => setForm({ ...form, sort_order: v })} />
            </div>
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
