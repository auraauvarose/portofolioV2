const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Cek format UUID sebelum id dipakai di query Postgres. Tanpa ini, id non-UUID
 * menghasilkan error driver `invalid input syntax for type uuid` yang bocor ke
 * klien dan sekaligus menandai kolom bertipe uuid.
 */
export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}
