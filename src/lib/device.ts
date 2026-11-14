import { userAgentFromString } from "next/server";

export function parseDevice(ua: string | null): "mobile" | "tablet" | "desktop" {
  if (!ua) return "desktop";
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) return "tablet";
  if (/Android/i.test(ua) && !/Mobile/i.test(ua)) return "tablet";
  if (/Mobi|iPhone|Android/i.test(ua)) return "mobile";
  return "desktop";
}

export function parseBrowser(ua: string | null): string | null {
  if (!ua) return null;
  if (/Edg[A-Za-z]*\//.test(ua)) return "Edge";
  if (/OPR\/|OPiOS\/|Opera/.test(ua)) return "Opera";
  if (/SamsungBrowser/.test(ua)) return "Samsung Internet";
  if (/Chrome\/|CriOS/.test(ua)) return "Chrome";
  if (/Firefox\/|FxiOS/.test(ua)) return "Firefox";
  if (/Safari\//.test(ua)) return "Safari";
  return "Lainnya";
}

const PHONE_BRANDS: ReadonlyArray<readonly [RegExp, string]> = [
  [/iPhone|iPad|iPod|Macintosh/i, "Apple"],
  [/Samsung|SM-[A-Z0-9]|GT-I/i, "Samsung"],
  [/Xiaomi|Redmi|POCO/i, "Xiaomi"],
  [/OPPO/i, "Oppo"],
  [/vivo/i, "Vivo"],
  [/realme|\bRMX\d{4}\b/i, "Realme"],
  [/Huawei/i, "Huawei"],
  [/HONOR/i, "Honor"],
  [/OnePlus/i, "OnePlus"],
  [/Pixel/i, "Google"],
  [/ASUS|ZenFone|ROG Phone/i, "Asus"],
  [/Infinix/i, "Infinix"],
  [/Tecno/i, "Tecno"],
  [/Nokia/i, "Nokia"],
  [/Motorola|moto /i, "Motorola"],
  [/Sony|Xperia/i, "Sony"],
  [/LG-|LGE/i, "LG"],
];

export function parsePhoneBrand(ua: string | null, model: string | null = null): string | null {
  if (!ua) return null;
  const hint = model?.replace(/^"|"$/g, "").trim().slice(0, 120) || "";
  const source = hint && /Android/i.test(ua)
    ? ua.replace(/(Android [^;)]*;)[^)]*/, (_match, platform: string) => `${platform} ${hint}`)
    : ua;
  const vendor = userAgentFromString(source).device.vendor;
  const hardware = vendor || source.split(")")[0];
  for (const [pattern, brand] of PHONE_BRANDS) {
    if (pattern.test(hardware)) return brand;
  }
  // ponytail: browser dapat menyembunyikan hardware; jangan menebak merek dari OS.
  return vendor || null;
}
