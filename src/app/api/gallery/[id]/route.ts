import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error: authError } = await requireUser();
  if (authError) return authError;

  const { id } = await params;
  const supabase = await createSupabaseServer();
  const body = await req.json();

  const { data, error } = await supabase
    .from("gallery_photos")
    .update({
      title_en: body.title_en ?? null,
      title_id: body.title_id ?? null,
      image_url: body.image_url,
      category: body.category ?? "general",
      sort_order: body.sort_order ?? 0,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error: authError } = await requireUser();
  if (authError) return authError;

  const { id } = await params;
  const supabase = await createSupabaseServer();

  const { error } = await supabase.from("gallery_photos").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
