type Coercer = (body: Record<string, unknown>) => unknown;

/**
 * Bangun objek update hanya dari kolom yang BENAR-BENAR dikirim klien.
 *
 * Tanpa ini, handler PUT menulis ulang seluruh baris dengan pola `?? null`, jadi
 * body parsial (mis. `{ title_en: "x" }`) menghapus slug, konten, tech_stack,
 * dan me-reset sort_order/featured. Field yang absen dibiarkan apa adanya.
 *
 * `hasOwnProperty` dipakai supaya kunci warisan prototype tidak dianggap field
 * yang dikirim. Nilai `null` yang dikirim eksplisit tetap diteruskan agar klien
 * masih bisa mengosongkan kolom opsional.
 */
export function partialUpdate(
  body: unknown,
  coercers: Record<string, Coercer>,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (!body || typeof body !== "object") return patch;

  const source = body as Record<string, unknown>;
  for (const [column, coerce] of Object.entries(coercers)) {
    if (Object.prototype.hasOwnProperty.call(source, column)) {
      patch[column] = coerce(source);
    }
  }
  return patch;
}
