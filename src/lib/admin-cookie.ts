export const ADMIN_COOKIE = "admin_session";

export function computeSessionValue(secret: string): string {
  if (!secret) return "";
  let h = 0;
  for (let i = 0; i < secret.length; i++) {
    h = (Math.imul(31, h) + secret.charCodeAt(i)) | 0;
  }
  return `admin-${(h >>> 0).toString(36)}`;
}
