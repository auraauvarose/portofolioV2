import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error: authError } = await requireUser();
  if (authError) return authError;

  const { id } = await params;
  const supabase = await createSupabaseAdmin();
  const body = await req.json();

  const { data, error } = await supabase
    .from("projects")
    .update({
      title_en: body.title_en,
      title_id: body.title_id ?? body.title_en,
      description_en: body.description_en ?? null,
      description_id: body.description_id ?? null,
      category: body.category ?? "professional",
      year: body.year ?? null,
      image_url: body.image_url ?? null,
      link: body.link ?? null,
      tech_stack: body.tech_stack ?? [],
      sort_order: body.sort_order ?? 0,
      featured: body.featured ?? true,
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
  const supabase = await createSupabaseAdmin();

  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
