import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin, withJsonErrors } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth";
import { invalidate } from "@/lib/revalidate-content";
import { CACHE_TAGS } from "@/lib/supabase/public";
import { deleteR2IfUnreferenced } from "@/lib/r2-cleanup";
import { partialUpdate } from "@/lib/partial-update";
import { isUuid } from "@/lib/uuid";

const IMAGE_COLUMN = { table: "gallery_photos", column: "image_url" } as const;

const COLUMNS = {
  title_en: (b: Record<string, unknown>) => b.title_en ?? null,
  title_id: (b: Record<string, unknown>) => b.title_id ?? null,
  image_url: (b: Record<string, unknown>) => b.image_url,
  alt_text: (b: Record<string, unknown>) => b.alt_text ?? null,
  category: (b: Record<string, unknown>) => b.category ?? "general",
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
    .from("gallery_photos")
    .select("image_url")
    .eq("id", id)
    .maybeSingle();

  const previousImage =
    (before as { image_url: string | null } | null)?.image_url ?? null;

  const { data, error } = await supabase
    .from("gallery_photos")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Foto tidak ditemukan." }, { status: 404 });
    }
    console.error("gallery PUT:", error.message);
    return NextResponse.json({ error: "Gagal memperbarui foto." }, { status: 400 });
  }

  const nextImage = (data as { image_url: string | null }).image_url;
  if (previousImage && previousImage !== nextImage) {
    await deleteR2IfUnreferenced(supabase, IMAGE_COLUMN, previousImage);
  }

  invalidate(CACHE_TAGS.gallery);
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
    .from("gallery_photos")
    .select("image_url")
    .eq("id", id)
    .maybeSingle();

  const imageUrl =
    (before as { image_url: string | null } | null)?.image_url ?? null;

  const { data: removed, error } = await supabase
    .from("gallery_photos")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("gallery DELETE:", error.message);
    return NextResponse.json({ error: "Gagal menghapus foto." }, { status: 400 });
  }
  if (!removed || removed.length === 0) {
    return NextResponse.json({ error: "Foto tidak ditemukan." }, { status: 404 });
  }

  await deleteR2IfUnreferenced(supabase, IMAGE_COLUMN, imageUrl);

  invalidate(CACHE_TAGS.gallery);
  return NextResponse.json({ ok: true });
});
