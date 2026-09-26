export const ADMIN_COOKIE = "admin_session";

const SESSION_DOMAIN = "admin-session-v1:";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

const encoder = new TextEncoder();

function bytesToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return bytesToHex(sig);
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionValue(secret: string): Promise<string> {
  if (!secret) return "";
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  return `${exp}.${await hmacHex(secret, SESSION_DOMAIN + exp)}`;
}

export async function verifySessionValue(
  secret: string,
  value: string | undefined | null,
): Promise<boolean> {
  if (!secret || !value) return false;
  const dot = value.indexOf(".");
  if (dot < 1) return false;
  const expRaw = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  if (!/^\d+$/.test(expRaw) || !/^[0-9a-f]{64}$/.test(sig)) return false;
  const exp = Number(expRaw);
  if (!Number.isSafeInteger(exp) || exp * 1000 <= Date.now()) return false;
  const expected = await hmacHex(secret, SESSION_DOMAIN + exp);
  return safeEqual(expected, sig);
}
