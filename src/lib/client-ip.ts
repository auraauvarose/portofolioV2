import type { NextRequest } from "next/server";

/**
 * IP klien untuk keperluan rate-limit.
 *
 * Di Cloudflare Workers header `CF-Connecting-IP` diisi oleh Cloudflare sendiri
 * dan tidak bisa dipalsukan klien. `X-Forwarded-For` SENGAJA tidak dipakai:
 * Cloudflare menambahkan IP-nya di BELAKANG daftar, sehingga entri pertama
 * berasal dari klien dan bisa dipalsukan sesuka hati.
 */
export function clientIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip")?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}
