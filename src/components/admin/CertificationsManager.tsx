"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import ImageUpload from "@/components/admin/ImageUpload";
import Field from "@/components/admin/Field";
import FileThumb from "@/components/admin/FileThumb";
import ReorderableRow from "@/components/admin/ReorderableRow";
import { useReorder } from "@/lib/use-reorder";
import { PlusIcon, PencilIcon, TrashIcon, InboxIcon } from "@/components/admin/icons";
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
  credential_url: "",
  alt_text: "",
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

  const { dragHandlers, dragId, overId, saving: reordering, error: reorderError, moveBy } =
    useReorder<Certification>("certifications", items, setItems);

  async function load() {
    const { data } = await supabase
      .from("certifications")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
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
      credential_url: c.credential_url ?? "",
      alt_text: c.alt_text ?? "",
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
      credential_url: form.credential_url || null,
      alt_text: form.alt_text || null,
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
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-gray-500">Library</p>
          <h2 className="text-display text-2xl uppercase text-white">Certifications</h2>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition-colors duration-300 hover:bg-accent-soft active:scale-[0.98]"
        >
          <PlusIcon />
          Add certification
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
          <p className="text-sm text-gray-500">No certifications yet.</p>
        </div>
      ) : (
        <div className="admin-list mb-8 space-y-0">
          {items.map((c, i) => (
            <ReorderableRow
              key={c.id}
              index={i}
              total={items.length}
              dragging={dragId === c.id}
              dropTarget={overId === c.id && dragId !== c.id}
              saving={reordering}
              dragProps={dragHandlers(i)}
              onMoveUp={() => moveBy(c.id, -1)}
              onMoveDown={() => moveBy(c.id, 1)}
            >
              <FileThumb url={c.image_url} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-white">{c.title_en}</p>
                <p className="truncate text-xs text-gray-500">
                  {c.category} · {c.issuer}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => openEdit(c)}
                  aria-label={`Edit ${c.title_en}`}
                  title="Edit"
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-white transition-colors duration-300 hover:border-accent hover:text-accent active:scale-[0.98]"
                >
                  <PencilIcon />
                </button>
                <button
                  onClick={() => remove(c)}
                  aria-label={`Delete ${c.title_en}`}
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
        <form onSubmit={save} className="admin-fade-up border-y border-white/10 py-7">
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
                className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2.5 text-sm text-white outline-none transition-colors duration-300 hover:border-white/30 focus:border-accent"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-black">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <Field label="Sort order" value={form.sort_order} onChange={(v) => setForm({ ...form, sort_order: v })} />
            <Field
              label="Credential URL"
              value={form.credential_url}
              onChange={(v) => setForm({ ...form, credential_url: v })}
              placeholder="https://verify.example.com/..."
            />
            <div className="md:col-span-2">
              <Field
                label="Image alt text"
                value={form.alt_text}
                onChange={(v) => setForm({ ...form, alt_text: v })}
                placeholder="Describe the certificate image"
              />
            </div>
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
