import { deviceLabel, formatWibTime } from "./visit-log";

/**
 * Notifikasi Telegram saat ada pengunjung baru.
 *
 * Kenapa Telegram, bukan email: Cloudflare Workers tidak punya SMTP, jadi
 * email butuh layanan pihak ketiga + verifikasi domain. Telegram cukup satu
 * HTTP POST, tanpa kuota harian, tanpa dependency baru.
 *
 * Kalau `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` kosong, modul ini tidak
 * melakukan apa pun — situs tetap jalan normal tanpa notifikasi.
 */

export type VisitNotifyInput = {
  ip: string;
  path: string;
  device: string | null;
  browser: string | null;
  phoneBrand: string | null;
  country: string | null;
  city: string | null;
  createdAt: string;
};

/** Satu orang yang membuka banyak halaman tetap dihitung satu notifikasi. */
const DEDUP_MS = 6 * 60 * 60 * 1000;
const seen = new Map<string, number>();

/**
 * `true` kalau IP ini belum pernah dinotifikasi dalam 6 jam terakhir.
 *
 * Catatan: peta ini hidup di memori isolate. Di Cloudflare Workers ia bisa
 * kosong lagi setelah cold start atau di isolate lain, jadi dedup ini
 * best-effort — sama seperti throttle di route analytics.
 */
export function shouldNotify(ip: string, now: number = Date.now()): boolean {
  const last = seen.get(ip) ?? 0;
  if (now - last < DEDUP_MS) return false;
  seen.set(ip, now);
  if (seen.size > 5000) {
    const cutoff = now - DEDUP_MS;
    for (const [k, t] of seen) if (t < cutoff) seen.delete(k);
  }
  return true;
}

/** Isi pesan notifikasi. Dipisah dari pengiriman supaya bisa dites. */
export function visitMessage(v: VisitNotifyInput): string {
  const brand = v.phoneBrand?.trim() || "—";
  const geo = [v.city, v.country].filter(Boolean).join(", ") || "—";
  const device = deviceLabel(v.device) + (v.browser ? ` · ${v.browser}` : "");
  return [
    "👀 Ada yang membuka website kamu",
    "",
    `Waktu     : ${formatWibTime(v.createdAt)}`,
    `IP        : ${v.ip}`,
    `Merek     : ${brand}`,
    `Perangkat : ${device}`,
    `Lokasi    : ${geo}`,
    `Halaman   : ${v.path}`,
  ].join("\n");
}

/**
 * Kirim notifikasi. Tidak pernah melempar error: kegagalan Telegram tidak
 * boleh menggagalkan pencatatan analytics.
 */
export async function notifyVisit(v: VisitNotifyInput): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) return;

  // IP "unknown" (mis. request dari localhost) tidak berguna untuk notifikasi.
  if (!v.ip || v.ip === "unknown") return;
  if (!shouldNotify(v.ip)) return;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: visitMessage(v),
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      // Body dibaca seperlunya saja; URL berisi token jadi tidak ikut dicetak.
      console.warn("telegram notify:", res.status, (await res.text()).slice(0, 200));
    }
  } catch (err) {
    console.warn("telegram notify gagal:", err instanceof Error ? err.name : "unknown");
  }
}
