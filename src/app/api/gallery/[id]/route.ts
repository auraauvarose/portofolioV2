import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin, withJsonErrors } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth";
import { invalidate } from "@/lib/revalidate-content";
import { CACHE_TAGS } from "@/lib/supabase/public";
import { deleteR2IfUnreferenced } from "@/lib/r2-cleanup";

const IMAGE_COLUMN = { table: "gallery_photos", column: "image_url" } as const;

export const PUT = withJsonErrors(async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error: authError } = await requireUser();
  if (authError) return authError;

  const { id } = await params;
  const supabase = await createSupabaseAdmin();
  const body = await req.json();

  const { data: before } = await supabase
    .from("gallery_photos")
    .select("image_url")
    .eq("id", id)
    .maybeSingle();

  const previousImage =
    (before as { image_url: string | null } | null)?.image_url ?? null;

  const { data, error } = await supabase
    .from("gallery_photos")
    .update({
      title_en: body.title_en ?? null,
      title_id: body.title_id ?? null,
      image_url: body.image_url,
      alt_text: body.alt_text ?? null,
      category: body.category ?? "general",
      sort_order: body.sort_order ?? 0,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

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
  const supabase = await createSupabaseAdmin();

  const { data: before } = await supabase
    .from("gallery_photos")
    .select("image_url")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("gallery_photos").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const imageUrl =
    (before as { image_url: string | null } | null)?.image_url ?? null;
  await deleteR2IfUnreferenced(supabase, IMAGE_COLUMN, imageUrl);

  invalidate(CACHE_TAGS.gallery);
  return NextResponse.json({ ok: true });
});
