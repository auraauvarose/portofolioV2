import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin, withJsonErrors } from "@/lib/supabase/admin";
import { clientIp } from "@/lib/client-ip";
import { sendTelegram } from "@/lib/telegram";
import {
  certificateRequestMessage,
  parseCertificateRequest,
} from "@/lib/certificate-request";

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

/**
 * Permintaan izin lihat sertifikat. Disimpan ke `contact_messages` (subject
 * ditandai) supaya muncul di menu admin "Pesan", sekaligus dikirim ke Telegram.
 */
export const POST = withJsonErrors(async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  // Honeypot: bot yang mengisi field tersembunyi dianggap sukses tanpa disimpan.
  if (body && typeof body === "object" && (body as Record<string, unknown>).website) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const parsed = parseCertificateRequest(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { name, purpose } = parsed.value;

  const ip = clientIp(req);
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Coba lagi nanti." },
      { status: 429 },
    );
  }

  const supabase = await createSupabaseAdmin();
  const { error } = await supabase.from("contact_messages").insert({
    name,
    // Form ini tidak meminta email; kolomnya NOT NULL jadi diisi penanda.
    email: "—",
    subject: "Minta izin lihat sertifikat",
    message: purpose,
    status: "new",
    ip_hash: null,
  });

  if (error) {
    console.error("certificate request insert failed:", error.message);
    return NextResponse.json(
      { error: "Gagal mengirim permintaan." },
      { status: 500 },
    );
  }

  await sendTelegram(certificateRequestMessage({ name, purpose, ip }));

  return NextResponse.json({ ok: true }, { status: 201 });
});
