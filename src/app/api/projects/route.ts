import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { error: authError } = await requireUser();
  if (authError) return authError;

  const supabase = await createSupabaseServer();
  const body = await req.json();

  const { data, error } = await supabase
    .from("projects")
    .insert({
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
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data, { status: 201 });
}
