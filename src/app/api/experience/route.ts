import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin, withJsonErrors } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth";
import { invalidate } from "@/lib/revalidate-content";
import { CACHE_TAGS } from "@/lib/supabase/public";

// ============================================================================
// /api/experience — CRUD riwayat kerja (admin only).
// ============================================================================

const MAX = { role: 120, company: 120, location: 120, period: 60, desc: 2000 };

function clean(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function fields(body: Record<string, unknown>) {
  const role_en = clean(body.role_en, MAX.role);
  const role_id = clean(body.role_id, MAX.role) || role_en;
  return {
    role_en,
    role_id,
    company: clean(body.company, MAX.company),
    location: clean(body.location, MAX.location) || null,
    period: clean(body.period, MAX.period) || null,
    current: body.current === true,
    description_en: clean(body.description_en, MAX.desc) || null,
    description_id: clean(body.description_id, MAX.desc) || null,
    sort_order: Number.isFinite(Number(body.sort_order))
      ? Number(body.sort_order)
      : 0,
  };
}

// ---------------------------------------------------------------------------
// GET — daftar pengalaman (admin only).
// ---------------------------------------------------------------------------
export const GET = withJsonErrors(async function GET() {
  const { error: authError } = await requireUser();
  if (authError) return authError;

  const supabase = await createSupabaseAdmin();
  const { data, error } = await supabase
    .from("experience")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("experience GET:", error.message);
    return NextResponse.json({ error: "Gagal memuat." }, { status: 500 });
  }
  invalidate(CACHE_TAGS.experience);
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
  if (!payload.role_en) {
    return NextResponse.json({ error: "Role wajib diisi." }, { status: 400 });
  }
  if (!payload.company) {
    return NextResponse.json({ error: "Company wajib diisi." }, { status: 400 });
  }

  const supabase = await createSupabaseAdmin();
  const { data, error } = await supabase
    .from("experience")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("experience POST:", error.message);
    return NextResponse.json({ error: "Gagal menyimpan." }, { status: 500 });
  }
  invalidate(CACHE_TAGS.experience);
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
  if (!payload.role_en || !payload.company) {
    return NextResponse.json(
      { error: "Role dan company wajib diisi." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseAdmin();
  const { data, error } = await supabase
    .from("experience")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("experience PUT:", error.message);
    return NextResponse.json({ error: "Gagal menyimpan." }, { status: 500 });
  }
  invalidate(CACHE_TAGS.experience);
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
  const { error } = await supabase.from("experience").delete().eq("id", id);
  if (error) {
    console.error("experience DELETE:", error.message);
    return NextResponse.json({ error: "Gagal menghapus." }, { status: 500 });
  }
  invalidate(CACHE_TAGS.experience);
  return NextResponse.json({ ok: true });
});
