import { NextResponse } from "next/server";
import { ADMIN_PASSWORD, ADMIN_COOKIE_SECRET } from "@/lib/config";

/**
 * Diagnostic endpoint — tells you what the admin auth config actually looks
 * like on the deployed server, WITHOUT leaking the real password.
 *
 * Use it to confirm whether Vercel's ADMIN_PASSWORD env var really took effect.
 * Returns only the length and a hash fingerprint, never the value itself.
 */
function fingerprint(s: string): string {
  // Small, stable hash so you can compare "is this the same value as before"
  // without ever seeing the secret.
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

export async function GET() {
  const raw = process.env.ADMIN_PASSWORD;
  const effectiveLength = ADMIN_PASSWORD.length;
  return NextResponse.json({
    // What the fallback-aware config resolved to (the length is safe to show).
    activePasswordLength: effectiveLength,
    // Raw env var presence + length (before the "aura2007" fallback).
    rawEnvPasswordLength: raw !== undefined ? raw.length : null,
    rawEnvPasswordSet: raw !== undefined,
    // Fingerprints so you can confirm values match your intent between builds.
    activePasswordFingerprint: fingerprint(ADMIN_PASSWORD),
    rawEnvPasswordFingerprint:
      raw !== undefined ? fingerprint(raw) : null,
    // Whether the current effective password equals the aura2007 fallback.
    isDefaultFallback: ADMIN_PASSWORD === "aura2007",
    cookieSecretSet: Boolean(ADMIN_COOKIE_SECRET),
  });
}
