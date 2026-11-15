export type PerfTier = "off" | "low" | "high";

/**
 * Tier perangkat untuk memilih intensitas animasi. Murni: tidak menyentuh DOM,
 * jadi bisa diuji langsung. Hanya `off | low | high` — nilai ini TIDAK boleh
 * dipakai sebagai cabang tampilan (warna/opacity/teks), hanya intensitas gerak.
 */
export function parseTier(input: {
  hardwareConcurrency?: number;
  deviceMemory?: number;
  reducedMotion: boolean;
  saveData?: boolean;
}): PerfTier {
  if (input.reducedMotion) return "off";
  if (input.saveData) return "low";
  const cores = input.hardwareConcurrency ?? 4;
  const mem = input.deviceMemory ?? 4;
  if (cores >= 8 && mem >= 8) return "high";
  return "low";
}
