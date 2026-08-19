"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import ImageUpload from "@/components/admin/ImageUpload";
import Field from "@/components/admin/Field";
import type { Certification } from "@/types";

const CATEGORIES = ["internship", "professional", "technical"];

const EMPTY = {
  title_en: "",
  title_id: "",
  issuer: "",
  category: "professional",
  date: "",
  description_en: "",
  description_id: "",
  sort_order: "0",
  image_url: "",
};

export default function CertificationsManager() {
  const supabase = createSupabaseBrowser();
  const [items, setItems] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Certification | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase
      .from("certifications")
      .select("*")
      .order("sort_order", { ascending: true });
    setItems((data as Certification[]) ?? []);
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

  function openEdit(c: Certification) {
    setEditing(c);
    setForm({
      title_en: c.title_en,
      title_id: c.title_id,
      issuer: c.issuer ?? "",
      category: c.category,
      date: c.date ?? "",
      description_en: c.description_en ?? "",
      description_id: c.description_id ?? "",
      sort_order: String(c.sort_order),
      image_url: c.image_url ?? "",
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
      issuer: form.issuer || null,
      category: form.category,
      date: form.date || null,
      description_en: form.description_en || null,
      description_id: form.description_id || null,
      image_url: form.image_url || null,
      sort_order: Number(form.sort_order) || 0,
    };

    let res: Response;
    if (editing) {
      res = await fetch(`/api/certifications/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetch("/api/certifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(`Error: ${data.error ?? "Gagal menyimpan"}`);
    } else {
      setMessage(editing ? "Certification updated ✓" : "Certification created ✓");
      setEditing(null);
      setShowForm(false);
      await load();
    }
    setSaving(false);
  }

  async function remove(c: Certification) {
    if (!confirm(`Delete "${c.title_en}"?`)) return;
    const res = await fetch(`/api/certifications/${c.id}`, { method: "DELETE" });
    if (res.ok) await load();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-display text-2xl uppercase text-white">Certifications</h2>
        <button
          onClick={openNew}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold uppercase tracking-widest text-black hover:opacity-90"
        >
          + Add certification
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
          No certifications yet.
        </p>
      ) : (
        <div className="mb-8 space-y-3">
          {items.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-4 rounded-xl border border-white/10 bg-black/20 p-3"
            >
              <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-black/40">
                {c.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image_url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-white">{c.title_en}</p>
                <p className="truncate text-xs text-gray-500">
                  {c.category} · {c.issuer}
                </p>
              </div>
              <button
                onClick={() => openEdit(c)}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white hover:border-accent hover:text-accent"
              >
                Edit
              </button>
              <button
                onClick={() => remove(c)}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-gray-400 hover:border-red-500 hover:text-red-400"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <form onSubmit={save} className="rounded-2xl border border-white/10 bg-black/20 p-6">
          <h3 className="mb-5 text-lg font-semibold text-white">
            {editing ? "Edit certification" : "New certification"}
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title (EN)" required value={form.title_en} onChange={(v) => setForm({ ...form, title_en: v })} />
            <Field label="Title (ID)" value={form.title_id} onChange={(v) => setForm({ ...form, title_id: v })} />
            <Field label="Issuer" value={form.issuer} onChange={(v) => setForm({ ...form, issuer: v })} />
            <Field label="Date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} placeholder="e.g. Dec 2025" />
            <div>
              <span className="mb-1 block text-xs uppercase tracking-widest text-gray-400">Category</span>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-accent"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-black">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <Field label="Sort order" value={form.sort_order} onChange={(v) => setForm({ ...form, sort_order: v })} />
            <div className="md:col-span-2">
              <Field label="Description (EN)" textarea value={form.description_en} onChange={(v) => setForm({ ...form, description_en: v })} />
            </div>
            <div className="md:col-span-2">
              <Field label="Description (ID)" textarea value={form.description_id} onChange={(v) => setForm({ ...form, description_id: v })} />
            </div>
            <div className="md:col-span-2">
              <ImageUpload
                folder="certifications"
                value={form.image_url || null}
                onChange={(url) => setForm({ ...form, image_url: url })}
                label="Certificate image"
              />
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
