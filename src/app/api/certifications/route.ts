import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { error: authError } = await requireUser();
  if (authError) return authError;

  const supabase = await createSupabaseAdmin();
  const body = await req.json();

  const { data, error } = await supabase
    .from("certifications")
    .insert({
      title_en: body.title_en,
      title_id: body.title_id ?? body.title_en,
      issuer: body.issuer ?? null,
      category: body.category ?? "professional",
      date: body.date ?? null,
      description_en: body.description_en ?? null,
      description_id: body.description_id ?? null,
      image_url: body.image_url ?? null,
      sort_order: body.sort_order ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
