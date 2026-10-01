import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin, withJsonErrors } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth";
import { invalidate } from "@/lib/revalidate-content";
import { CACHE_TAGS } from "@/lib/supabase/public";
import { createSupabaseServer } from "@/lib/supabase/server";
import { clientIp } from "@/lib/client-ip";
import { isUuid } from "@/lib/uuid";

export const dynamic = "force-dynamic";

const RATE_WINDOW_MS = 60_000;
const rateMap = new Map<string, number>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const last = rateMap.get(key) ?? 0;
  if (now - last < RATE_WINDOW_MS) return true;
  rateMap.set(key, now);
  if (rateMap.size > 5000) {
    const cutoff = now - RATE_WINDOW_MS;
    for (const [k, t] of rateMap) {
      if (t < cutoff) rateMap.delete(k);
    }
  }
  return false;
}

function clean(v: unknown): string {
  return typeof v === "string" ? v.replace(/\s+$/g, "").trim() : "";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const GET = withJsonErrors(async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope");

  if (scope === "admin") {
    const { error: authError } = await requireUser();
    if (authError) return authError;

    const supabase = await createSupabaseAdmin();
    const { data, error } = await supabase
      .from("comments")
      .select("id,name,email,message,rating,approved,created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      console.error("comments GET(admin):", error.message);
      return NextResponse.json(
        { error: "Gagal memuat komentar." },
        { status: 400 },
      );
    }
    return NextResponse.json({ comments: data ?? [] });
  }

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("comments")
    .select("id,name,message,rating,created_at")
    .eq("approved", true)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) {
    console.error("comments GET:", error.message);
    return NextResponse.json({ error: "Gagal memuat komentar." }, { status: 400 });
  }
  return NextResponse.json({ comments: data ?? [] });
});

export const POST = withJsonErrors(async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (clean(body.website)) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const name = clean(body.name).slice(0, 60);
  const email = clean(body.email).slice(0, 120);
  const message = clean(body.message).slice(0, 1000);
  const ratingRaw = Number(body.rating);
  const rating =
    Number.isInteger(ratingRaw) && ratingRaw >= 1 && ratingRaw <= 5
      ? ratingRaw
      : null;

  if (name.length < 1) {
    return NextResponse.json({ error: "Nama wajib diisi." }, { status: 400 });
  }
  if (message.length < 2) {
    return NextResponse.json(
      { error: "Pesan minimal 2 karakter." },
      { status: 400 },
    );
  }
  if (email && !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Format email tidak valid." }, { status: 400 });
  }

  const ip = clientIp(req);
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Terlalu sering. Tunggu sebentar lagi." },
      { status: 429 },
    );
  }

  const supabase = await createSupabaseAdmin();
  const { data, error } = await supabase
    .from("comments")
    .insert({
      name,
      email: email || null,
      message,
      rating,
      approved: false,
    })
    .select("id,name,message,rating,created_at")
    .single();

  if (error) {
    console.error("comments POST:", error.message);
    return NextResponse.json(
      { error: "Gagal menyimpan komentar." },
      { status: 400 },
    );
  }
  invalidate(CACHE_TAGS.comments);
  return NextResponse.json({ ...data, pending: true }, { status: 201 });
});

export const PATCH = withJsonErrors(async function PATCH(req: NextRequest) {
  const { error: authError } = await requireUser();
  if (authError) return authError;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const id = clean(body.id);
  if (!id) return NextResponse.json({ error: "id wajib diisi." }, { status: 400 });
  if (!isUuid(id)) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
  }

  if (typeof body.approved !== "boolean") {
    return NextResponse.json(
      { error: "approved harus boolean." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseAdmin();
  const { data, error } = await supabase
    .from("comments")
    .update({ approved: body.approved })
    .eq("id", id)
    .select("id,approved")
    .maybeSingle();

  if (error) {
    console.error("comments PATCH:", error.message);
    return NextResponse.json(
      { error: "Gagal memperbarui komentar." },
      { status: 400 },
    );
  }
  if (!data) {
    return NextResponse.json({ error: "Komentar tidak ditemukan." }, { status: 404 });
  }
  invalidate(CACHE_TAGS.comments);
  return NextResponse.json(data);
});

export const DELETE = withJsonErrors(async function DELETE(req: NextRequest) {
  const { error: authError } = await requireUser();
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  if (!isUuid(id)) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
  }

  const supabase = await createSupabaseAdmin();
  const { data: removed, error } = await supabase
    .from("comments")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("comments DELETE:", error.message);
    return NextResponse.json(
      { error: "Gagal menghapus komentar." },
      { status: 400 },
    );
  }
  if (!removed || removed.length === 0) {
    return NextResponse.json(
      { error: "Komentar tidak ditemukan." },
      { status: 404 },
    );
  }
  invalidate(CACHE_TAGS.comments);
  return NextResponse.json({ ok: true });
});
