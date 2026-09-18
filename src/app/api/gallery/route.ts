import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin, withJsonErrors } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth";
import { invalidate } from "@/lib/revalidate-content";
import { CACHE_TAGS } from "@/lib/supabase/public";

export const POST = withJsonErrors(async function POST(req: NextRequest) {
  const { error: authError } = await requireUser();
  if (authError) return authError;

  const supabase = await createSupabaseAdmin();
  const body = await req.json();

  const { data, error } = await supabase
    .from("gallery_photos")
    .insert({
      title_en: body.title_en ?? null,
      title_id: body.title_id ?? null,
      image_url: body.image_url,
      alt_text: body.alt_text ?? null,
      category: body.category ?? "general",
      sort_order: body.sort_order ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  invalidate(CACHE_TAGS.gallery);
  return NextResponse.json(data, { status: 201 });
});
