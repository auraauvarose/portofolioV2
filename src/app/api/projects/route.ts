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
      repo_url: body.repo_url ?? null,
      alt_text: body.alt_text ?? null,
      slug: body.slug ?? null,
      content_en: body.content_en ?? null,
      content_id: body.content_id ?? null,
      tech_stack: body.tech_stack ?? [],
      sort_order: body.sort_order ?? 0,
      featured: body.featured ?? true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  invalidate(CACHE_TAGS.projects);
  return NextResponse.json(data, { status: 201 });
});
