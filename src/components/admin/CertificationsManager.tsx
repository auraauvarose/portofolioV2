"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import ImageUpload from "@/components/admin/ImageUpload";
import Field from "@/components/admin/Field";
import FileThumb from "@/components/admin/FileThumb";
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
import { useReorder } from "@/lib/use-reorder";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  BadgeIcon,
} from "@/components/admin/icons";
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

  const {
    dragHandlers,
    dragId,
    overId,
    saving: reordering,
    error: reorderError,
    moveBy,
  } = useReorder<Certification>("certifications", items, setItems);

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
    requestAnimationFrame(() =>
      document
        .getElementById("cert-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
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
    requestAnimationFrame(() =>
      document
        .getElementById("cert-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
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
      setMessage(`Gagal menyimpan: ${data.error ?? "terjadi kesalahan"}`);
    } else {
      setMessage(editing ? "Sertifikasi diperbarui." : "Sertifikasi ditambahkan.");
      setEditing(null);
      setShowForm(false);
      await load();
    }
    setSaving(false);
  }

  async function remove(c: Certification) {
    if (!confirm(`Hapus sertifikasi "${c.title_en}"? Tindakan ini permanen.`))
      return;
    const res = await fetch(`/api/certifications/${c.id}`, { method: "DELETE" });
    if (res.ok) await load();
    else setMessage("Gagal menghapus sertifikasi.");
  }

  const withoutFile = items.filter((c) => !c.image_url).length;

  return (
    <div>
      <PanelHeader
        title="Sertifikasi"
        description="Tampil di seksi Certifications. Sertifikat tanpa berkas tetap muncul, tetapi tampil sebagai baris teks tanpa pratinjau."
        meta={
          !loading && (
            <>
              <Chip tone="neutral">{items.length} total</Chip>
              {withoutFile > 0 && (
                <Chip tone="warn">{withoutFile} tanpa berkas</Chip>
              )}
            </>
          )
        }
        actions={
          <Button variant="primary" icon={PlusIcon} onClick={openNew}>
            Sertifikasi baru
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

      {loading ? (
        <ListSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          icon={BadgeIcon}
          title="Belum ada sertifikasi"
          hint="Tambahkan sertifikat, magang, atau kredensial teknis beserta berkasnya."
          action={
            <Button variant="primary" icon={PlusIcon} onClick={openNew}>
              Sertifikasi baru
            </Button>
          }
        />
      ) : (
        <div className="mb-8">
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
                <p className="truncate text-sm font-medium text-[var(--color-a-text)]">
                  {c.title_en}
                </p>
                <p className="a-data mt-0.5 truncate a-meta text-[var(--color-a-faint)]">
                  {[c.issuer, c.date, c.category].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Chip tone="neutral">{c.category}</Chip>
                <IconButton
                  icon={PencilIcon}
                  label={`Edit ${c.title_en}`}
                  onClick={() => openEdit(c)}
                />
                <IconButton
                  icon={TrashIcon}
                  label={`Hapus ${c.title_en}`}
                  danger
                  onClick={() => remove(c)}
                />
              </div>
            </ReorderableRow>
          ))}
        </div>
      )}

      {showForm && (
        <form
          id="cert-form"
          onSubmit={save}
          className="admin-fade-up a-panel scroll-mt-24 p-5 sm:p-6"
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-a-line)] pb-4">
            <h3 className="text-display text-lg uppercase text-[var(--color-a-text)]">
              {editing ? "Edit sertifikasi" : "Sertifikasi baru"}
            </h3>
            {editing && (
              <span className="a-data a-meta text-[var(--color-a-faint)]">
                {editing.id.slice(0, 8)}
              </span>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Judul (EN)"
              required
              value={form.title_en}
              onChange={(v) => setForm({ ...form, title_en: v })}
            />
            <Field
              label="Judul (ID)"
              value={form.title_id}
              onChange={(v) => setForm({ ...form, title_id: v })}
              hint="Kosongkan untuk memakai judul versi Inggris."
            />
            <Field
              label="Penerbit"
              value={form.issuer}
              onChange={(v) => setForm({ ...form, issuer: v })}
              placeholder="Dicoding, Coursera, Kampus…"
            />
            <Field
              label="Tanggal"
              value={form.date}
              onChange={(v) => setForm({ ...form, date: v })}
              placeholder="Des 2025"
              hint="Teks bebas — ditampilkan apa adanya."
            />

            <Field
              label="Kategori"
              value={form.category}
              onChange={(v) => setForm({ ...form, category: v })}
              render={({ id, describedBy, className }) => (
                <select
                  id={id}
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  aria-describedby={describedBy}
                  className={className}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              )}
              hint="Menentukan pengelompokan di halaman publik."
            />
            <Field
              label="Urutan"
              type="number"
              value={form.sort_order}
              onChange={(v) => setForm({ ...form, sort_order: v })}
              hint="Angka kecil tampil lebih dulu."
            />

            <div className="md:col-span-2">
              <Field
                label="URL kredensial"
                type="url"
                value={form.credential_url}
                onChange={(v) => setForm({ ...form, credential_url: v })}
                placeholder="https://verify.example.com/…"
                hint="Halaman verifikasi resmi penerbit. Muncul sebagai tautan di situs."
              />
            </div>

            <div className="md:col-span-2">
              <Field
                label="Teks alternatif gambar"
                value={form.alt_text}
                onChange={(v) => setForm({ ...form, alt_text: v })}
                placeholder="Jelaskan isi gambar sertifikat untuk pembaca layar"
              />
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

            <div className="md:col-span-2">
              <ImageUpload
                folder="certifications"
                value={form.image_url || null}
                onChange={(url) => setForm({ ...form, image_url: url })}
                label="Berkas sertifikat"
              />
            </div>
          </div>

          <FormActions>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? "Menyimpan…" : "Simpan sertifikasi"}
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
