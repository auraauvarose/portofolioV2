export const DEFAULT_SITE_URL = "https://auraauvarose.my.id";

export function siteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.CF_PAGES_URL ||
    DEFAULT_SITE_URL;
  return raw.replace(/\/+$/, "");
}

export function absoluteUrl(path = "/"): string {
  const base = siteUrl();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export const SITE_NAME = "Aura Auvarose";
export const SITE_TITLE = "Aura Auvarose — Full Stack Developer";
export const SITE_DESCRIPTION =
  "Aura Auvarose — full stack developer & IT student based in Indonesia, building polished, high-performance web and mobile applications.";
