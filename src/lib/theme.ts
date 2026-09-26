export const THEME_CHOICES = ["dark", "light"] as const;

export type Theme = (typeof THEME_CHOICES)[number];

export function isTheme(value: unknown): value is Theme {
  return value === "dark" || value === "light";
}

export function readStoredTheme(raw: string | null | undefined): Theme {
  return raw === "light" ? "light" : "dark";
}
