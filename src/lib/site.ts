// ============================================================================
// Situs — base URL & helper metadata.
//
// Sumber URL, berurutan:
//   1. NEXT_PUBLIC_SITE_URL  (set di .env.local / Worker build env) ← utama
//   2. CF_PAGES_URL / VERCEL_URL  (kalau suatu saat pindah host)
//   3. DEFAULT_SITE_URL  (fallback terakhir)
//
// Nilai ini dipakai untuk metadataBase, canonical, sitemap, robots, dan
// URL absolut di Open Graph. Kalau salah, robots.txt & sitemap menunjuk ke
// host yang tidak ada — jadi penting untuk diset eksplisit di CI.
// ============================================================================

/**
 * Fallback terakhir bila NEXT_PUBLIC_SITE_URL tidak diset.
 *
 * Ini domain publik yang sebenarnya, supaya canonical, robots.txt, sitemap,
 * Open Graph, dan JSON-LD tidak pernah menunjuk ke alamat workers.dev
 * (yang akan memecah sinyal SEO karena dua host menyajikan isi yang sama).
 */
export const DEFAULT_SITE_URL = "https://auraauvarose.my.id";

export function siteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.CF_PAGES_URL ||
    DEFAULT_SITE_URL;
  // Buang slash di akhir agar penggabungan path selalu konsisten.
  return raw.replace(/\/+$/, "");
}

/** Gabungkan base URL dengan path relatif. */
export function absoluteUrl(path = "/"): string {
  const base = siteUrl();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Judul & deskripsi situs — dipakai metadata, OG, dan JSON-LD. */
export const SITE_NAME = "Aura Auvarose";
export const SITE_TITLE = "Aura Auvarose — Full Stack Developer";
export const SITE_DESCRIPTION =
  "Aura Auvarose — full stack developer & IT student based in Indonesia, building polished, high-performance web and mobile applications.";
