import type { NextConfig } from "next";

/**
 * Header keamanan dasar. OpenNext membacanya dari `routes-manifest.json`
 * (`ConfigHeaders` → `applyMiddlewareHeaders`), jadi ini ikut terkirim pada
 * respons HTML SSR seperti `/admin` — bukan hanya pada aset statis di `public/`.
 *
 * CSP sengaja hanya memuat direktif yang tidak menyentuh skrip: tema gelap
 * dipasang lewat skrip inline di `src/app/layout.tsx`, sehingga `script-src`
 * akan memerlukan nonce dan berisiko mematahkan halaman. `frame-ancestors`
 * sudah cukup untuk menutup clickjacking pada `/admin`.
 */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
