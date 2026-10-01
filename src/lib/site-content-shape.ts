const MAX_STRING_LENGTH = 50_000;

function describe(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function check(
  fallback: unknown,
  value: unknown,
  requireAllKeys: boolean,
  path: string,
): string | null {
  if (Array.isArray(fallback)) {
    if (!Array.isArray(value)) {
      return `${path} harus berupa array, bukan ${describe(value)}`;
    }
    if (fallback.length === 0) return null;
    const sample = fallback[0];
    for (let i = 0; i < value.length; i++) {
      // Elemen array harus lengkap: `[{ }]` pada daftar kategori bikin render
      // menabrak `cat.title.en` dan mematikan seluruh halaman.
      const err = check(sample, value[i], true, `${path}[${i}]`);
      if (err) return err;
    }
    return null;
  }

  if (fallback !== null && typeof fallback === "object") {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return `${path} harus berupa objek, bukan ${describe(value)}`;
    }
    const source = value as Record<string, unknown>;
    const expected = fallback as Record<string, unknown>;

    if (requireAllKeys) {
      for (const key of Object.keys(expected)) {
        if (!Object.prototype.hasOwnProperty.call(source, key)) {
          return `${path}.${key} wajib ada`;
        }
      }
    }
    for (const key of Object.keys(source)) {
      if (Object.prototype.hasOwnProperty.call(expected, key)) {
        const err = check(expected[key], source[key], requireAllKeys, `${path}.${key}`);
        if (err) return err;
      }
    }
    return null;
  }

  if (fallback === null) return null;

  if (typeof value !== typeof fallback) {
    return `${path} harus bertipe ${typeof fallback}, bukan ${describe(value)}`;
  }
  if (typeof value === "string" && value.length > MAX_STRING_LENGTH) {
    return `${path} terlalu panjang`;
  }
  return null;
}

/**
 * Bandingkan bentuk data yang dikirim klien dengan bentuk default yang sudah
 * diketahui benar. Mengembalikan pesan kesalahan, atau `null` bila cocok.
 *
 * Pemeriksaan lama hanya melihat tipe di lapisan teratas, sehingga
 * `PUT /api/site-content {key:"about", data:{paragraphs:{}}}` lolos dan
 * `about.paragraphs.map` menabrak TypeError di render — satu request admin
 * bisa mematikan beranda untuk semua pengunjung.
 *
 * Kunci yang absen di `value` boleh (override parsial), kunci tambahan yang
 * tidak dikenal default juga boleh. Yang ditolak adalah perbedaan tipe dan
 * elemen array yang tidak lengkap.
 */
export function deepShapeMatches(fallback: unknown, value: unknown): string | null {
  return check(fallback, value, false, "data");
}
