import { isUuid } from "@/lib/uuid";

export const REORDER_TABLES = [
  "projects",
  "certifications",
  "gallery_photos",
  "experience",
  "testimonials",
] as const;

export type ReorderTable = (typeof REORDER_TABLES)[number];

export function isReorderTable(v: unknown): v is ReorderTable {
  return (
    typeof v === "string" && (REORDER_TABLES as readonly string[]).includes(v)
  );
}

export const MAX_REORDER_ITEMS = 500;

export type ReorderValidation =
  | { ok: true; table: ReorderTable; ids: string[] }
  | { ok: false; error: string };

/**
 * Validasi payload reorder.
 *
 * Diletakkan di `src/lib` supaya route dan tes mengimpor aturan yang SAMA.
 * Sebelumnya tes menyalin ulang aturan ini, jadi route bisa diubah tanpa ada
 * satu pun tes yang gagal.
 */
export function validateReorderPayload(body: unknown): ReorderValidation {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Data tidak valid." };
  }

  const { table, ids } = body as { table?: unknown; ids?: unknown };

  if (!isReorderTable(table)) {
    return { ok: false, error: "Tabel tidak dikenal." };
  }
  if (!Array.isArray(ids) || ids.length === 0) {
    return { ok: false, error: "ids wajib berupa array." };
  }
  if (ids.length > MAX_REORDER_ITEMS) {
    return { ok: false, error: "Terlalu banyak item." };
  }
  if (!ids.every((id) => isUuid(id))) {
    return { ok: false, error: "Ada id yang tidak valid." };
  }
  if (new Set(ids).size !== ids.length) {
    return { ok: false, error: "Ada id duplikat." };
  }

  return { ok: true, table, ids: ids as string[] };
}
