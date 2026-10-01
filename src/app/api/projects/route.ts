import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin, withJsonErrors } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth";
import { invalidate } from "@/lib/revalidate-content";
import { CACHE_TAGS } from "@/lib/supabase/public";
import { normalizeSlug } from "@/lib/slug";

export const POST = withJsonErrors(async function POST(req: NextRequest) {
  const { error: authError } = await requireUser();
  if (authError) return authError;

  const supabase = await createSupabaseAdmin();
  const body = await req.json();

  const rawSlug = body.slug;
  const slug = normalizeSlug(rawSlug);
  if (typeof rawSlug === "string" && rawSlug.trim() && !slug) {
    return NextResponse.json(
      { error: "Slug tidak valid: gunakan huruf, angka, dan tanda hubung." },
      { status: 400 },
    );
  }

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
      slug,
      content_en: body.content_en ?? null,
      content_id: body.content_id ?? null,
      tech_stack: body.tech_stack ?? [],
      sort_order: body.sort_order ?? 0,
      featured: body.featured ?? true,
    })
    .select()
    .single();

  if (error) {
    // Pesan mentah dari driver Postgres membocorkan nama kolom dan constraint,
    // jadi hanya kode duplikat yang diterjemahkan ke pesan yang bisa ditindak.
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Slug sudah dipakai proyek lain." },
        { status: 409 },
      );
    }
    console.error("projects POST:", error.message);
    return NextResponse.json(
      { error: "Gagal menyimpan proyek." },
      { status: 400 },
    );
  }
  invalidate(CACHE_TAGS.projects);
  return NextResponse.json(data, { status: 201 });
});
