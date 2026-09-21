// ============================================================================
// Kontrak tema — satu sumber kebenaran untuk nilai tema yang sah.
//
// Dipakai provider (menyimpan/menerapkan) dan menu kontrol halaman (memilih).
// Nilai tersimpan di localStorage bisa rusak/diubah manual, jadi pembacaan
// selalu divalidasi dan jatuh ke "dark" — tema default situs.
// ============================================================================

export const THEME_CHOICES = ["dark", "light"] as const;

export type Theme = (typeof THEME_CHOICES)[number];

export function isTheme(value: unknown): value is Theme {
  return value === "dark" || value === "light";
}

/** Baca nilai tema tersimpan; apa pun yang tidak sah dianggap "dark". */
export function readStoredTheme(raw: string | null | undefined): Theme {
  return raw === "light" ? "light" : "dark";
}
