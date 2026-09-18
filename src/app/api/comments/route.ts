import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin, withJsonErrors } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth";
import { invalidate } from "@/lib/revalidate-content";
import { CACHE_TAGS } from "@/lib/supabase/public";
import { createSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Rate limit (in-memory, per instance — cukup untuk memperlambat spam, bukan
// proteksi absolut). 1 komentar per IP per 60 detik.
// ---------------------------------------------------------------------------
const RATE_WINDOW_MS = 60_000;
const rateMap = new Map<string, number>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const last = rateMap.get(key) ?? 0;
  if (now - last < RATE_WINDOW_MS) return true;
  rateMap.set(key, now);
  // Cegah map tumbuh tanpa batas
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

/** IP asli di Cloudflare — `x-forwarded-for` bisa dipalsukan klien. */
function clientIp(req: NextRequest): string {
  const cf = (req as NextRequest & { cf?: { clientIp?: string } }).cf;
  if (cf?.clientIp) return cf.clientIp;
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

// ---------------------------------------------------------------------------
// GET — daftar komentar.
//   ?scope=admin  → semua komentar + email pengirim (admin only)
//   (default)     → komentar terpublikasi tanpa email (publik)
// ---------------------------------------------------------------------------
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
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ comments: data ?? [] });
  }

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("comments")
    .select("id,name,message,rating,created_at")
    .eq("approved", true)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ comments: data ?? [] });
});

// ---------------------------------------------------------------------------
// POST — kirim komentar baru (publik, tervalidasi)
// ---------------------------------------------------------------------------
export const POST = withJsonErrors(async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Honeypot: field tersembunyi yang harusnya tetap kosong — kalau terisi,
  // hampir pasti bot. Balas sukses palsu agar bot tidak mencoba lagi.
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

  // Tulis via service_role (RLS insert policy tetap memvalidasi panjang).
  // `approved: false` → komentar masuk antrean moderasi dulu, tidak langsung
  // tayang. Admin menyetujui lewat /admin → Comments.
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

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  // Balas tanpa menyingkap status moderasi — pengirim cukup tahu terkirim.
  invalidate(CACHE_TAGS.comments);
  return NextResponse.json({ ...data, pending: true }, { status: 201 });
});

// ---------------------------------------------------------------------------
// PATCH — moderasi komentar (admin only). Body: { id, approved }
// Menyembunyikan komentar dari publik tanpa menghapusnya.
// ---------------------------------------------------------------------------
export const PATCH = withJsonErrors(async function PATCH(req: NextRequest) {
  const { error: authError } = await requireUser();
  if (authError) return authError;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const id = clean(body.id);
  if (!id) return NextResponse.json({ error: "id wajib diisi." }, { status: 400 });

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

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) {
    return NextResponse.json({ error: "Komentar tidak ditemukan." }, { status: 404 });
  }
  invalidate(CACHE_TAGS.comments);
  return NextResponse.json(data);
});

// ---------------------------------------------------------------------------
// DELETE — hapus komentar (admin only)
// ---------------------------------------------------------------------------
export const DELETE = withJsonErrors(async function DELETE(req: NextRequest) {
  const { error: authError } = await requireUser();
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = await createSupabaseAdmin();
  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  invalidate(CACHE_TAGS.comments);
  return NextResponse.json({ ok: true });
});
