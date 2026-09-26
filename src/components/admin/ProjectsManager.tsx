"use client";

import { useEffect, useMemo, useState } from "react";
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
  ProjectIcon,
  SearchIcon,
  StarIcon,
} from "@/components/admin/icons";
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

function gaps(p: Project): string[] {
  const out: string[] = [];
  if (!p.image_url) out.push("tanpa gambar");
  if (!p.description_en && !p.description_id) out.push("tanpa deskripsi");
  if (!p.link && !p.repo_url) out.push("tanpa tautan");
  if (!p.slug) out.push("tanpa slug");
  return out;
}

export default function ProjectsManager() {
  const supabase = createSupabaseBrowser();
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const {
    dragHandlers,
    dragId,
    overId,
    saving: reordering,
    error: reorderError,
    moveBy,
  } = useReorder<Project>("projects", items, setItems);

  async function load() {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    setItems((data as Project[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((p) =>
      [p.title_en, p.title_id, p.category, p.year ?? "", p.slug ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [items, query]);

  function openNew() {
    setEditing(null);
    setForm({ ...EMPTY });
    setMessage(null);
    setShowForm(true);
    requestAnimationFrame(() => {
      document
        .getElementById("project-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
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
    requestAnimationFrame(() => {
      document
        .getElementById("project-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
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
      setMessage(`Gagal menyimpan: ${data.error ?? "terjadi kesalahan"}`);
    } else {
      setMessage(editing ? "Proyek diperbarui." : "Proyek ditambahkan.");
      setEditing(null);
      setShowForm(false);
      await load();
    }
    setSaving(false);
  }

  async function remove(p: Project) {
    if (!confirm(`Hapus proyek "${p.title_en}"? Tindakan ini permanen.`)) return;
    const res = await fetch(`/api/projects/${p.id}`, { method: "DELETE" });
    if (res.ok) await load();
    else setMessage("Gagal menghapus proyek.");
  }

  const featuredCount = items.filter((p) => p.featured).length;
  const incomplete = items.filter((p) => gaps(p).length > 0).length;

  return (
    <div>
      <PanelHeader
        title="Proyek"
        description="Muncul di seksi Work halaman utama. Urutan di sini menentukan urutan tampil di situs."
        meta={
          !loading && (
            <>
              <Chip tone="neutral">{items.length} total</Chip>
              <Chip tone="accent">{featuredCount} unggulan</Chip>
              {incomplete > 0 && <Chip tone="warn">{incomplete} belum lengkap</Chip>}
            </>
          )
        }
        actions={
          <Button variant="primary" icon={PlusIcon} onClick={openNew}>
            Proyek baru
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

      {!loading && items.length > 6 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-[var(--color-a-line-2)] bg-[var(--color-a-surface)] px-3">
          <SearchIcon className="h-4 w-4 shrink-0 text-[var(--color-a-faint)]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari judul, kategori, atau slug…"
            aria-label="Cari proyek"
            className="w-full bg-transparent py-2.5 text-sm text-[var(--color-a-text)] outline-none placeholder:text-[var(--color-a-faint)]"
          />
          {query && (
            <span className="a-data shrink-0 a-meta text-[var(--color-a-faint)]">
              {visible.length}/{items.length}
            </span>
          )}
        </div>
      )}

      {loading ? (
        <ListSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          icon={ProjectIcon}
          title="Belum ada proyek"
          hint="Proyek pertama akan muncul di seksi Work halaman utama. Tambahkan satu untuk mulai."
          action={
            <Button variant="primary" icon={PlusIcon} onClick={openNew}>
              Proyek baru
            </Button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={SearchIcon}
          title={`Tidak ada yang cocok dengan “${query}”`}
          action={
            <Button variant="ghost" onClick={() => setQuery("")}>
              Hapus pencarian
            </Button>
          }
        />
      ) : (
        <div className="mb-8">
          {visible.map((p) => {
            const missing = gaps(p);
            const realIndex = items.findIndex((x) => x.id === p.id);
            return (
              <ReorderableRow
                key={p.id}
                index={realIndex}
                total={items.length}
                dragging={dragId === p.id}
                dropTarget={overId === p.id && dragId !== p.id}
                saving={reordering}
                dragProps={dragHandlers(realIndex)}
                onMoveUp={() => moveBy(p.id, -1)}
                onMoveDown={() => moveBy(p.id, 1)}
              >
                <FileThumb url={p.image_url} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    {p.title_en ? (
                      <p className="truncate text-sm font-medium text-[var(--color-a-text)]">
                        {p.title_en}
                      </p>
                    ) : (
                      <p className="truncate text-sm font-medium italic text-[var(--color-a-warn)]">
                        Tanpa judul
                      </p>
                    )}
                    {p.featured && (
                      <span
                        title="Ditandai unggulan"
                        className="inline-flex items-center gap-1 text-[var(--color-a-accent)]"
                      >
                        <StarIcon filled className="h-3 w-3" />
                        <span className="sr-only">Unggulan</span>
                      </span>
                    )}
                  </div>
                  <p className="a-data mt-0.5 truncate a-meta text-[var(--color-a-faint)]">
                    {p.category}
                    {p.year ? ` · ${p.year}` : ""}
                    {p.slug ? ` · /work/${p.slug}` : ""}
                  </p>
                  {missing.length > 0 && (
                    <p className="mt-1.5 a-meta text-[var(--color-a-warn)]">
                      Belum lengkap: {missing.join(", ")}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <IconButton
                    icon={PencilIcon}
                    label={`Edit ${p.title_en}`}
                    onClick={() => openEdit(p)}
                  />
                  <IconButton
                    icon={TrashIcon}
                    label={`Hapus ${p.title_en}`}
                    danger
                    onClick={() => remove(p)}
                  />
                </div>
              </ReorderableRow>
            );
          })}
        </div>
      )}

      {showForm && (
        <form
          id="project-form"
          onSubmit={save}
          className="admin-fade-up a-panel scroll-mt-24 p-5 sm:p-6"
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-a-line)] pb-4">
            <h3 className="text-display text-lg uppercase text-[var(--color-a-text)]">
              {editing ? "Edit proyek" : "Proyek baru"}
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
              label="Kategori"
              value={form.category}
              onChange={(v) => setForm({ ...form, category: v })}
              list="project-categories"
              hint="Dipakai sebagai label filter di situs publik."
            />
            <datalist id="project-categories">
              <option value="professional" />
              <option value="personal" />
              <option value="academic" />
              <option value="opensource" />
            </datalist>
            <Field
              label="Tahun"
              value={form.year}
              onChange={(v) => setForm({ ...form, year: v })}
              placeholder="2025"
            />
            <Field
              label="Tautan demo"
              type="url"
              value={form.link}
              onChange={(v) => setForm({ ...form, link: v })}
              placeholder="https://…"
            />
            <Field
              label="Repositori"
              type="url"
              value={form.repo_url}
              onChange={(v) => setForm({ ...form, repo_url: v })}
              placeholder="https://github.com/…"
            />
            <Field
              label="Tech stack"
              value={form.tech_stack}
              onChange={(v) => setForm({ ...form, tech_stack: v })}
              placeholder="Next.js, TypeScript, Postgres"
              hint="Pisahkan dengan koma."
            />
            <Field
              label="Slug halaman studi kasus"
              value={form.slug}
              onChange={(v) => setForm({ ...form, slug: v })}
              placeholder="nama-proyek"
              hint={
                <>
                  Huruf kecil, angka, dan tanda hubung. Kosongkan bila belum
                  ingin halaman studi kasus. URL:{" "}
                  <code className="a-data text-[var(--color-a-accent)]">
                    /work/{form.slug || "slug-kamu"}
                  </code>
                </>
              }
            />

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
              <Field
                label="Isi studi kasus (EN)"
                textarea
                rows={6}
                value={form.content_en}
                onChange={(v) => setForm({ ...form, content_en: v })}
                hint={
                  <>
                    Mengisi halaman{" "}
                    <code className="a-data text-[var(--color-a-accent)]">
                      /work/{form.slug || "slug"}
                    </code>
                    . Pisahkan paragraf dengan satu baris kosong. Kosongkan untuk
                    memakai Deskripsi (EN).
                  </>
                }
              />
            </div>
            <div className="md:col-span-2">
              <Field
                label="Isi studi kasus (ID)"
                textarea
                rows={6}
                value={form.content_id}
                onChange={(v) => setForm({ ...form, content_id: v })}
              />
            </div>

            <div className="md:col-span-2">
              <Field
                label="Teks alternatif gambar"
                value={form.alt_text}
                onChange={(v) => setForm({ ...form, alt_text: v })}
                placeholder="Jelaskan isi gambar untuk pembaca layar"
                hint="Dibacakan pembaca layar dan dipakai mesin pencari. Sebutkan isi gambarnya, bukan nama berkas."
              />
            </div>

            <div className="md:col-span-2">
              <ImageUpload
                folder="projects"
                value={form.image_url || null}
                onChange={(url) => setForm({ ...form, image_url: url })}
                label="Gambar proyek"
              />
            </div>

            <div className="flex flex-wrap items-center gap-6 md:col-span-2">
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[var(--color-a-text)]">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) =>
                    setForm({ ...form, featured: e.target.checked })
                  }
                  className="h-4 w-4 accent-[var(--color-a-accent)]"
                />
                Tandai sebagai unggulan
              </label>
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
          </div>

          <FormActions>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? "Menyimpan…" : "Simpan proyek"}
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
