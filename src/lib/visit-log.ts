export type VisitLogEntry = {
  path: string;
  device: string;
  location: string;
  time: string;
};

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

export const deviceLabel = (device: string | null): string =>
  device ? (DEVICE_LABELS[device] ?? device) : "—";

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

export function formatLocation(city: string | null, country: string | null): string {
  if (city && country) return `${city}, ${country}`;
  if (country) return country;
  if (city) return city;
  return "—";
}

export function visitLogEntry(row: VisitLogRow): VisitLogEntry {
  return {
    path: row.path,
    device: deviceLabel(row.device),
    location: formatLocation(row.city, row.country),
    time: formatWibTime(row.created_at),
  };
}