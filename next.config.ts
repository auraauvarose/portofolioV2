import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Gambar berasal dari Cloudflare R2 dan disajikan apa adanya.
    // Optimizer Next butuh server image (tidak tersedia di Workers tanpa
    // binding tambahan), jadi optimasi dilakukan di sisi upload.
    unoptimized: true,
  },
  // Lint dijalankan sebagai langkah terpisah (`pnpm lint`) supaya build tidak
  // gagal karena aturan bergaya. CI menjalankan keduanya.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
