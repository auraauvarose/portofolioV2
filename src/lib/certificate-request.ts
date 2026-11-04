export const MAX_NAME = 80;
export const MAX_PURPOSE = 1000;

export type CertificateRequestValue = {
  name: string;
  purpose: string;
};

export type CertificateRequestParse =
  | { ok: true; value: CertificateRequestValue }
  | { ok: false; error: string };

function clean(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/** Validasi body permintaan izin lihat sertifikat. */
export function parseCertificateRequest(body: unknown): CertificateRequestParse {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Data tidak valid." };
  }

  const raw = body as Record<string, unknown>;
  const name = clean(raw.name).slice(0, MAX_NAME);
  const purpose = clean(raw.purpose).slice(0, MAX_PURPOSE);

  if (name.length < 2) return { ok: false, error: "Nama minimal 2 karakter." };
  if (purpose.length < 3) {
    return { ok: false, error: "Tujuan minimal 3 karakter." };
  }

  return { ok: true, value: { name, purpose } };
}

/** Isi notifikasi Telegram. */
export function certificateRequestMessage(
  v: CertificateRequestValue & { ip: string },
): string {
  return [
    "🔒 Ada yang minta izin lihat sertifikat",
    "",
    `Nama   : ${v.name}`,
    `Tujuan : ${v.purpose}`,
    `IP     : ${v.ip}`,
  ].join("\n");
}

/** Subject penanda di `contact_messages` untuk permintaan izin sertifikat. */
export const CERT_SUBJECT = "Minta izin lihat sertifikat";

/** Cookie per-perangkat: berisi id baris permintaan milik pengunjung. */
export const CERT_COOKIE = "cert_request";

export type CertificateAccess = "approved" | "denied" | "pending" | "none";

/**
 * Status akses dari baris `contact_messages`: admin menekan "Setuju" →
 * status `replied`, "Tidak" → `archived`.
 */
export function certificateAccess(
  row: { subject: string | null; status: string } | null | undefined,
): CertificateAccess {
  if (!row || row.subject !== CERT_SUBJECT) return "none";
  if (row.status === "replied") return "approved";
  if (row.status === "archived") return "denied";
  return "pending";
}
