import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin, withJsonErrors } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth";
import { invalidate } from "@/lib/revalidate-content";
import { CACHE_TAGS } from "@/lib/supabase/public";
import { deleteR2IfUnreferenced } from "@/lib/r2-cleanup";
import { partialUpdate } from "@/lib/partial-update";
import { normalizeSlug } from "@/lib/slug";
import { isUuid } from "@/lib/uuid";

const IMAGE_COLUMN = { table: "projects", column: "image_url" } as const;

const COLUMNS = {
  title_en: (b: Record<string, unknown>) => b.title_en,
  title_id: (b: Record<string, unknown>) => b.title_id ?? b.title_en,
  description_en: (b: Record<string, unknown>) => b.description_en ?? null,
  description_id: (b: Record<string, unknown>) => b.description_id ?? null,
  category: (b: Record<string, unknown>) => b.category ?? "professional",
  year: (b: Record<string, unknown>) => b.year ?? null,
  image_url: (b: Record<string, unknown>) => b.image_url ?? null,
  link: (b: Record<string, unknown>) => b.link ?? null,
  repo_url: (b: Record<string, unknown>) => b.repo_url ?? null,
  alt_text: (b: Record<string, unknown>) => b.alt_text ?? null,
  slug: (b: Record<string, unknown>) => normalizeSlug(b.slug),
  content_en: (b: Record<string, unknown>) => b.content_en ?? null,
  content_id: (b: Record<string, unknown>) => b.content_id ?? null,
  tech_stack: (b: Record<string, unknown>) => b.tech_stack ?? [],
  sort_order: (b: Record<string, unknown>) => b.sort_order ?? 0,
  featured: (b: Record<string, unknown>) => b.featured ?? true,
};

export const PUT = withJsonErrors(async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error: authError } = await requireUser();
  if (authError) return authError;

  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
  }

  const supabase = await createSupabaseAdmin();
  const body = await req.json();

  if (typeof body?.slug === "string" && body.slug.trim() && !normalizeSlug(body.slug)) {
    return NextResponse.json(
      { error: "Slug tidak valid: gunakan huruf, angka, dan tanda hubung." },
      { status: 400 },
    );
  }

  // Hanya kolom yang benar-benar dikirim yang ditulis. Sebelumnya handler ini
  // menulis ulang 16 kolom dengan pola `?? null`, jadi PUT `{title_en:"x"}`
  // menghapus slug, konten, dan tech_stack sekaligus me-reset sort_order.
  const patch = partialUpdate(body, COLUMNS);
  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { error: "Tidak ada kolom yang bisa diperbarui." },
      { status: 400 },
    );
  }

  const { data: before } = await supabase
    .from("projects")
    .select("image_url")
    .eq("id", id)
    .maybeSingle();

  const previousImage =
    (before as { image_url: string | null } | null)?.image_url ?? null;

  const { data, error } = await supabase
    .from("projects")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Slug sudah dipakai proyek lain." },
        { status: 409 },
      );
    }
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Proyek tidak ditemukan." }, { status: 404 });
    }
    console.error("projects PUT:", error.message);
    return NextResponse.json({ error: "Gagal memperbarui proyek." }, { status: 400 });
  }

  const nextImage = (data as { image_url: string | null }).image_url;
  if (previousImage && previousImage !== nextImage) {
    await deleteR2IfUnreferenced(supabase, IMAGE_COLUMN, previousImage);
  }

  invalidate(CACHE_TAGS.projects);
  return NextResponse.json(data);
});

export const DELETE = withJsonErrors(async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error: authError } = await requireUser();
  if (authError) return authError;

  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
  }

  const supabase = await createSupabaseAdmin();

  const { data: before } = await supabase
    .from("projects")
    .select("image_url")
    .eq("id", id)
    .maybeSingle();

  const imageUrl =
    (before as { image_url: string | null } | null)?.image_url ?? null;

  // `.select("id")` membuat Postgres mengembalikan baris yang benar-benar
  // terhapus. Sebelumnya handler ini menjawab `{ok:true}` walau tidak ada baris
  // yang cocok, sehingga UI melaporkan sukses untuk id yang salah.
  const { data: removed, error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("projects DELETE:", error.message);
    return NextResponse.json({ error: "Gagal menghapus proyek." }, { status: 400 });
  }
  if (!removed || removed.length === 0) {
    return NextResponse.json({ error: "Proyek tidak ditemukan." }, { status: 404 });
  }

  await deleteR2IfUnreferenced(supabase, IMAGE_COLUMN, imageUrl);

  invalidate(CACHE_TAGS.projects);
  return NextResponse.json({ ok: true });
});
