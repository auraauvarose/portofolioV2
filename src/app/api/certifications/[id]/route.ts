import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin, withJsonErrors } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth";
import { invalidate } from "@/lib/revalidate-content";
import { CACHE_TAGS } from "@/lib/supabase/public";
import { deleteR2IfUnreferenced } from "@/lib/r2-cleanup";
import { partialUpdate } from "@/lib/partial-update";
import { isUuid } from "@/lib/uuid";

const IMAGE_COLUMN = { table: "certifications", column: "image_url" } as const;

const COLUMNS = {
  title_en: (b: Record<string, unknown>) => b.title_en,
  title_id: (b: Record<string, unknown>) => b.title_id ?? b.title_en,
  issuer: (b: Record<string, unknown>) => b.issuer ?? null,
  category: (b: Record<string, unknown>) => b.category ?? "professional",
  date: (b: Record<string, unknown>) => b.date ?? null,
  description_en: (b: Record<string, unknown>) => b.description_en ?? null,
  description_id: (b: Record<string, unknown>) => b.description_id ?? null,
  image_url: (b: Record<string, unknown>) => b.image_url ?? null,
  alt_text: (b: Record<string, unknown>) => b.alt_text ?? null,
  credential_url: (b: Record<string, unknown>) => b.credential_url ?? null,
  sort_order: (b: Record<string, unknown>) => b.sort_order ?? 0,
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

  // Hanya kolom yang dikirim klien yang ditulis; body parsial tidak lagi
  // menghapus kolom lain dan me-reset sort_order.
  const patch = partialUpdate(body, COLUMNS);
  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { error: "Tidak ada kolom yang bisa diperbarui." },
      { status: 400 },
    );
  }

  const { data: before } = await supabase
    .from("certifications")
    .select("image_url")
    .eq("id", id)
    .maybeSingle();

  const previousImage =
    (before as { image_url: string | null } | null)?.image_url ?? null;

  const { data, error } = await supabase
    .from("certifications")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json(
        { error: "Sertifikat tidak ditemukan." },
        { status: 404 },
      );
    }
    console.error("certifications PUT:", error.message);
    return NextResponse.json(
      { error: "Gagal memperbarui sertifikat." },
      { status: 400 },
    );
  }

  const nextImage = (data as { image_url: string | null }).image_url;
  if (previousImage && previousImage !== nextImage) {
    await deleteR2IfUnreferenced(supabase, IMAGE_COLUMN, previousImage);
  }

  invalidate(CACHE_TAGS.certifications);
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
    .from("certifications")
    .select("image_url")
    .eq("id", id)
    .maybeSingle();

  const imageUrl =
    (before as { image_url: string | null } | null)?.image_url ?? null;

  const { data: removed, error } = await supabase
    .from("certifications")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("certifications DELETE:", error.message);
    return NextResponse.json(
      { error: "Gagal menghapus sertifikat." },
      { status: 400 },
    );
  }
  if (!removed || removed.length === 0) {
    return NextResponse.json(
      { error: "Sertifikat tidak ditemukan." },
      { status: 404 },
    );
  }

  await deleteR2IfUnreferenced(supabase, IMAGE_COLUMN, imageUrl);

  invalidate(CACHE_TAGS.certifications);
  return NextResponse.json({ ok: true });
});
