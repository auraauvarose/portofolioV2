// ============================================================================
// Geometri node pada rail timeline (dipakai seksi Education).
//
// Masalah yang diselesaikan: garis accent (fill) digerakkan oleh progres
// scroll (`scaleY`), sementara bulatan node dulu dinyalakan oleh band
// IntersectionObserver. Dua sumber kebenaran yang bergerak dengan kecepatan
// berbeda -> garis sudah melewati bulatan, bulatannya masih abu-abu.
//
// Solusinya: satu sumber kebenaran. Posisi tiap node diukur sebagai FRAKSI
// panjang rail, lalu node menyala tepat saat progres garis >= fraksi itu —
// jadi definisinya identik dengan "tepi garis sudah melewati node".
//
// Fungsi di sini murni (tanpa DOM) supaya bisa dikunci oleh test.
// ============================================================================

/**
 * Posisi tiap node sebagai fraksi panjang rail (0 = ujung atas, 1 = ujung
 * bawah). `centres` adalah jarak tiap pusat node dari titik nol container,
 * dalam ruang layout (bukan hasil getBoundingClientRect, yang ikut terdistorsi
 * transform masuknya kartu).
 *
 * Rail tanpa tinggi (belum terukur / display:none) menghasilkan NaN — bukan 0
 * — supaya "tidak bisa dinilai" tidak diam-diam terbaca sebagai "di ujung atas".
 */
export function nodeFractions(
  railTop: number,
  railHeight: number,
  centres: number[],
): number[] {
  if (!Number.isFinite(railTop) || !(railHeight > 0)) {
    return centres.map(() => Number.NaN);
  }
  return centres.map((centre) => {
    if (!Number.isFinite(centre)) return Number.NaN;
    return Math.min(1, Math.max(0, (centre - railTop) / railHeight));
  });
}

/**
 * Node mana yang menyala pada progres garis tertentu.
 *
 * `progress` adalah scaleY fill (0..1). Node dengan fraksi <= progress berarti
 * tepi garis sudah mencapai (atau melewati) pusatnya, jadi ia menyala. Fraksi
 * NaN tak pernah menyala. Monoton: menambah progress tidak pernah memadamkan
 * node yang sudah menyala.
 */
export function litMask(progress: number, fractions: number[]): boolean[] {
  const p = Number.isFinite(progress) ? progress : 0;
  return fractions.map((fraction) => Number.isFinite(fraction) && p >= fraction);
}
