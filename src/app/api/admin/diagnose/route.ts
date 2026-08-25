import { NextResponse } from "next/server";
import { ADMIN_PASSWORD, ADMIN_COOKIE_SECRET } from "@/lib/config";

function fingerprint(s: string): string {
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
    activePasswordLength: effectiveLength,
    rawEnvPasswordLength: raw !== undefined ? raw.length : null,
    rawEnvPasswordSet: raw !== undefined,
    activePasswordFingerprint: fingerprint(ADMIN_PASSWORD),
    rawEnvPasswordFingerprint:
      raw !== undefined ? fingerprint(raw) : null,
    isDefaultFallback: ADMIN_PASSWORD === "aura2007",
    cookieSecretSet: Boolean(ADMIN_COOKIE_SECRET),
  });
}
