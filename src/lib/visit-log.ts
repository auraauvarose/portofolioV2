// ============================================================================
// Log kunjungan — pemformat entri "device - lokasi - jam WIB".
//
// Murni fungsi pemetaan tanpa I/O supaya mudah dites: API mengirim baris
// mentah, modul ini merapikannya menjadi entri siap-tampil untuk panel admin.
// Tidak ada IP, user-agent, atau koordinat yang menyentuh log ini.
// ============================================================================

/** Entri log siap tampil di panel admin. */
export type VisitLogEntry = {
  path: string;
  device: string;
  location: string;
  time: string;
};

/** Baris mentah dari tabel page_views yang dipakai log. */
export type VisitLogRow = {
  path: string;
  device: string | null;
  country: string | null;
  city: string | null;
  created_at: string | null;
};

const DEVICE_LABELS: Record<string, string> = {
  mobile: "Ponsel",
  tablet: "Tablet",
  desktop: "Desktop",
};

/** Label perangkat yang dipakai bersama panel admin — satu sumber kebenaran. */
export const deviceLabel = (device: string | null): string =>
  device ? (DEVICE_LABELS[device] ?? device) : "—";

/**
 * Konversi timestamp ISO ke "14:32 WIB · 12 Feb" (zona WIB, UTC+7).
 * ISO tidak valid menghasilkan "-", bukan NaN.
 */
export function formatWibTime(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const wib = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  const hh = String(wib.getUTCHours()).padStart(2, "0");
  const mm = String(wib.getUTCMinutes()).padStart(2, "0");
  const bulan = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ];
  const tanggal = `${wib.getUTCDate()} ${bulan[wib.getUTCMonth()]}`;
  return `${hh}:${mm} WIB · ${tanggal}`;
}

/** "Jakarta, ID" | "ID" | "—" — tergantung data geolokasi yang tersedia. */
export function formatLocation(city: string | null, country: string | null): string {
  if (city && country) return `${city}, ${country}`;
  if (country) return country;
  if (city) return city;
  return "—";
}

/** Satu entri log "device - lokasi - jam" dari satu baris mentah. */
export function visitLogEntry(row: VisitLogRow): VisitLogEntry {
  return {
    path: row.path,
    device: deviceLabel(row.device),
    location: formatLocation(row.city, row.country),
    time: formatWibTime(row.created_at),
  };
}