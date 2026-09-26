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
  [/iPhone|iPad|iPod/i, "Apple"],
  [/Samsung|SM-[A-Z0-9]|GT-I/i, "Samsung"],
  [/Xiaomi|Redmi|POCO/i, "Xiaomi"],
  [/OPPO/i, "Oppo"],
  [/vivo/i, "Vivo"],
  [/realme/i, "Realme"],
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

export function parsePhoneBrand(ua: string | null): string | null {
  if (!ua || parseDevice(ua) !== "mobile") return null;
  for (const [pattern, brand] of PHONE_BRANDS) {
    if (pattern.test(ua)) return brand;
  }
  return "Lainnya";
}
