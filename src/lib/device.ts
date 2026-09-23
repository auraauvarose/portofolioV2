// ============================================================================
// Device parser — klasifikasi perangkat dari user-agent, dipakai oleh
// /api/analytics. Dipisah ke lib agar bisa dites langsung.
// ============================================================================

/** Tipe perangkat dari user-agent. UA asli tidak pernah disimpan. */
export function parseDevice(ua: string | null): "mobile" | "tablet" | "desktop" {
  if (!ua) return "desktop";
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) return "tablet";
  // Android tablet: Android tanpa kata "Mobile".
  if (/Android/i.test(ua) && !/Mobile/i.test(ua)) return "tablet";
  if (/Mobi|iPhone|Android/i.test(ua)) return "mobile";
  return "desktop";
}
