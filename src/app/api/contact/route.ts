import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin, withJsonErrors } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth";
import { contactForm } from "@/lib/config";

export const dynamic = "force-dynamic";

const RATE_WINDOW_MS = 120_000;
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
  return typeof v === "string" ? v.trim() : "";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const MAX_NAME = 80;
const MAX_EMAIL = 160;
const MAX_SUBJECT = 140;
const MAX_MESSAGE = 4000;

async function hashIp(ip: string): Promise<string | null> {
  const salt = process.env.ADMIN_COOKIE_SECRET || process.env.ADMIN_PASSWORD;
  if (!salt || !ip || ip === "unknown") return null;
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(salt),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(ip));
    return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 32);
  } catch {
    return null;
  }
}

function clientIp(req: NextRequest): string {
  const cf = (req as NextRequest & { cf?: { clientIp?: string } }).cf;
  if (cf?.clientIp) return cf.clientIp;
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export const GET = withJsonErrors(async function GET(req: NextRequest) {
  const { error: authError } = await requireUser();
  if (authError) return authError;

  const status = new URL(req.url).searchParams.get("status");
  const supabase = await createSupabaseAdmin();

  let query = supabase
    .from("contact_messages")
    .select("id,name,email,subject,message,budget,status,created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (status && ["new", "read", "replied", "archived"].includes(status)) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    console.error("contact_messages list failed:", error.message);
    return NextResponse.json({ error: "Gagal memuat pesan." }, { status: 500 });
  }
  return NextResponse.json({ messages: data ?? [] });
});

export const POST = withJsonErrors(async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  if (clean((body as Record<string, unknown>).website)) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const name = clean(body.name).slice(0, MAX_NAME);
  const email = clean(body.email).slice(0, MAX_EMAIL);
  const subject = clean(body.subject).slice(0, MAX_SUBJECT);
  const message = clean(body.message).slice(0, MAX_MESSAGE);
  const budget = clean(body.budget).slice(0, 60);

  const t = (key: keyof typeof contactForm.errors): string =>
    contactForm.errors[key].id;

  if (name.length < 2) {
    return NextResponse.json({ error: t("name") }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: t("email") }, { status: 400 });
  }
  if (message.length < 10) {
    return NextResponse.json({ error: t("message") }, { status: 400 });
  }

  const ip = clientIp(req);
  if (rateLimited(ip)) {
    return NextResponse.json({ error: t("rateLimited") }, { status: 429 });
  }

  const supabase = await createSupabaseAdmin();
  const { data, error } = await supabase
    .from("contact_messages")
    .insert({
      name,
      email,
      subject: subject || null,
      message,
      budget: budget || null,
      status: "new",
      ip_hash: await hashIp(ip),
    })
    .select("id,created_at")
    .single();

  if (error) {
    console.error("contact_messages insert failed:", error.message);
    return NextResponse.json({ error: "Gagal mengirim pesan." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
});

const STATUSES = ["new", "read", "replied", "archived"] as const;

export const PATCH = withJsonErrors(async function PATCH(req: NextRequest) {
  const { error: authError } = await requireUser();
  if (authError) return authError;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const id = clean(body.id);
  const status = clean(body.status);

  if (!id) {
    return NextResponse.json({ error: "id wajib diisi." }, { status: 400 });
  }
  if (!STATUSES.includes(status as (typeof STATUSES)[number])) {
    return NextResponse.json({ error: "Status tidak dikenal." }, { status: 400 });
  }

  const supabase = await createSupabaseAdmin();
  const { data, error } = await supabase
    .from("contact_messages")
    .update({ status })
    .eq("id", id)
    .select("id,status")
    .maybeSingle();

  if (error) {
    console.error("contact_messages update failed:", error.message);
    return NextResponse.json({ error: "Gagal memperbarui pesan." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Pesan tidak ditemukan." }, { status: 404 });
  }
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
  const { error } = await supabase.from("contact_messages").delete().eq("id", id);
  if (error) {
    console.error("contact_messages delete failed:", error.message);
    return NextResponse.json({ error: "Gagal menghapus pesan." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
});
