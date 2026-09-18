import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin, withJsonErrors } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth";
import { invalidate } from "@/lib/revalidate-content";
import { CACHE_TAGS } from "@/lib/supabase/public";

// ============================================================================
// /api/testimonials — CRUD social proof (admin only).
// ============================================================================

const MAX = { quote: 1000, author: 120, role: 120, company: 120, url: 500 };

function clean(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function fields(body: Record<string, unknown>) {
  const quote_en = clean(body.quote_en, MAX.quote);
  return {
    quote_en,
    quote_id: clean(body.quote_id, MAX.quote) || null,
    author: clean(body.author, MAX.author),
    role: clean(body.role, MAX.role) || null,
    company: clean(body.company, MAX.company) || null,
    avatar_url: clean(body.avatar_url, MAX.url) || null,
    link: clean(body.link, MAX.url) || null,
    sort_order: Number.isFinite(Number(body.sort_order))
      ? Number(body.sort_order)
      : 0,
  };
}

// ---------------------------------------------------------------------------
// GET — daftar testimoni (admin only).
// ---------------------------------------------------------------------------
export const GET = withJsonErrors(async function GET() {
  const { error: authError } = await requireUser();
  if (authError) return authError;

  const supabase = await createSupabaseAdmin();
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("testimonials GET:", error.message);
    return NextResponse.json({ error: "Gagal memuat." }, { status: 500 });
  }
  invalidate(CACHE_TAGS.testimonials);
  return NextResponse.json({ items: data ?? [] });
});

export const POST = withJsonErrors(async function POST(req: NextRequest) {
  const { error: authError } = await requireUser();
  if (authError) return authError;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const payload = fields(body as Record<string, unknown>);
  if (!payload.quote_en) {
    return NextResponse.json({ error: "Isi testimoni wajib diisi." }, { status: 400 });
  }
  if (!payload.author) {
    return NextResponse.json({ error: "Nama pemberi wajib diisi." }, { status: 400 });
  }

  const supabase = await createSupabaseAdmin();
  const { data, error } = await supabase
    .from("testimonials")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("testimonials POST:", error.message);
    return NextResponse.json({ error: "Gagal menyimpan." }, { status: 500 });
  }
  invalidate(CACHE_TAGS.testimonials);
  return NextResponse.json(data, { status: 201 });
});

export const PUT = withJsonErrors(async function PUT(req: NextRequest) {
  const { error: authError } = await requireUser();
  if (authError) return authError;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const { id } = body as { id?: unknown };
  if (typeof id !== "string" || !id) {
    return NextResponse.json({ error: "id wajib diisi." }, { status: 400 });
  }

  const payload = fields(body as Record<string, unknown>);
  if (!payload.quote_en || !payload.author) {
    return NextResponse.json(
      { error: "Isi testimoni dan nama wajib diisi." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseAdmin();
  const { data, error } = await supabase
    .from("testimonials")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("testimonials PUT:", error.message);
    return NextResponse.json({ error: "Gagal menyimpan." }, { status: 500 });
  }
  invalidate(CACHE_TAGS.testimonials);
  return NextResponse.json(data);
});

export const DELETE = withJsonErrors(async function DELETE(req: NextRequest) {
  const { error: authError } = await requireUser();
  if (authError) return authError;

  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id wajib diisi." }, { status: 400 });
  }

  const supabase = await createSupabaseAdmin();
  const { error } = await supabase.from("testimonials").delete().eq("id", id);
  if (error) {
    console.error("testimonials DELETE:", error.message);
    return NextResponse.json({ error: "Gagal menghapus." }, { status: 500 });
  }
  invalidate(CACHE_TAGS.testimonials);
  return NextResponse.json({ ok: true });
});
