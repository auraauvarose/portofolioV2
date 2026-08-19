import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { error: authError } = await requireUser();
  if (authError) return authError;

  const supabase = await createSupabaseServer();
  const body = await req.json();

  const { data, error } = await supabase
    .from("gallery_photos")
    .insert({
      title_en: body.title_en ?? null,
      title_id: body.title_id ?? null,
      image_url: body.image_url,
      category: body.category ?? "general",
      sort_order: body.sort_order ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
