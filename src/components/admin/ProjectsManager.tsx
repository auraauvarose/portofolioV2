"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import ImageUpload from "@/components/admin/ImageUpload";
import Field from "@/components/admin/Field";
import type { Project } from "@/types";

const EMPTY = {
  title_en: "",
  title_id: "",
  description_en: "",
  description_id: "",
  category: "professional",
  year: "",
  link: "",
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

  async function load() {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .order("sort_order", { ascending: true });
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
      image_url: form.image_url || null,
      tech_stack: form.tech_stack
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      sort_order: Number(form.sort_order) || 0,
      featured: form.featured,
    };

    const { error } = editing
      ? await supabase.from("projects").update(payload).eq("id", editing.id)
      : await supabase.from("projects").insert(payload);

    if (error) {
      setMessage(`Error: ${error.message}`);
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
    const { error } = await supabase.from("projects").delete().eq("id", p.id);
    if (!error) await load();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-display text-2xl uppercase text-white">Projects</h2>
        <button
          onClick={openNew}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold uppercase tracking-widest text-black hover:opacity-90"
        >
          + Add project
        </button>
      </div>

      {message && (
        <p className="mb-4 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300">
          {message}
        </p>
      )}

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : items.length === 0 ? (
        <p className="mb-8 rounded-xl border border-white/10 bg-black/20 p-8 text-center text-gray-500">
          No projects yet.
        </p>
      ) : (
        <div className="mb-8 space-y-3">
          {items.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-4 rounded-xl border border-white/10 bg-black/20 p-3"
            >
              <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-black/40">
                {p.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-white">{p.title_en}</p>
                <p className="truncate text-xs text-gray-500">
                  {p.category} · {p.year}
                </p>
              </div>
              <button
                onClick={() => openEdit(p)}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white hover:border-accent hover:text-accent"
              >
                Edit
              </button>
              <button
                onClick={() => remove(p)}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-gray-400 hover:border-red-500 hover:text-red-400"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={save}
          className="rounded-2xl border border-white/10 bg-black/20 p-6"
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
            <Field label="Tech stack (comma separated)" value={form.tech_stack} onChange={(v) => setForm({ ...form, tech_stack: v })} />
            <div className="md:col-span-2">
              <Field label="Description (EN)" textarea value={form.description_en} onChange={(v) => setForm({ ...form, description_en: v })} />
            </div>
            <div className="md:col-span-2">
              <Field label="Description (ID)" textarea value={form.description_id} onChange={(v) => setForm({ ...form, description_id: v })} />
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
              className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold uppercase tracking-widest text-black hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-white/15 px-6 py-2.5 text-sm text-gray-300 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
