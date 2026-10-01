import { test, describe, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { keyFromPublicUrl } from "../src/lib/r2-cleanup.ts";

/**
 * Berkas ini melengkapi `tests/r2-cleanup.test.ts` dengan kasus traversal
 * ter-encode. Perbaikan yang dikunci di sini: key di-DECODE lebih dulu, baru
 * divalidasi. Bila urutannya dibalik, `%2e%2e%2f` lolos filter `..` dan berubah
 * jadi `../` setelah decode — artinya `deleteR2Object` bisa diarahkan keluar dari
 * prefix bucket.
 */

const BASE = "https://cdn.example.com";
const ORIGINAL_BASE = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

before(() => {
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL = BASE;
});

after(() => {
  if (ORIGINAL_BASE === undefined) delete process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  else process.env.NEXT_PUBLIC_R2_PUBLIC_URL = ORIGINAL_BASE;
});

beforeEach(() => {
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL = BASE;
});

/** URL yang harus ditolak mentah-mentah (null). */
const HOSTILE_URLS: { url: string; why: string }[] = [
  { url: `${BASE}/%2e%2e%2fsecret`, why: "traversal ter-encode penuh" },
  { url: `${BASE}/%2e%2e%2f%2e%2e%2fetc/passwd`, why: "traversal ter-encode berlapis" },
  { url: `${BASE}/..%2fsecret`, why: "titik-titik + garis miring ter-encode" },
  { url: `${BASE}/..%2Fsecret`, why: "sama, huruf besar" },
  { url: `${BASE}/%2E%2E%2Fsecret`, why: "sama, semua huruf besar" },
  { url: `${BASE}/a/..%2Fb`, why: "campuran segmen normal dan ter-encode" },
  { url: `${BASE}/a/../../b`, why: "traversal mentah di tengah" },
  { url: `${BASE}/projects/../../etc/passwd`, why: "traversal mentah berlapis" },
  { url: `${BASE}/../secret`, why: "traversal mentah di depan" },
  { url: `${BASE}/a%2F..%2Fb`, why: "garis miring ter-encode lalu .." },
  { url: `${BASE}/%2e%2e`, why: "dua titik ter-encode" },
  { url: `${BASE}/..`, why: "dua titik mentah" },
  { url: `${BASE}/%2e%2e%2f`, why: "traversal ter-encode tanpa nama" },
];

describe("keyFromPublicUrl — traversal ter-encode", () => {
  for (const { url, why } of HOSTILE_URLS) {
    test(`menolak ${why}`, () => {
      assert.equal(
        keyFromPublicUrl(url),
        null,
        `${url} (${why}) seharusnya null`,
      );
    });
  }
});

describe("keyFromPublicUrl — key kosong dan pemisah URL", () => {
  test("key kosong ditolak", () => {
    assert.equal(keyFromPublicUrl(`${BASE}/`), null);
  });

  test("hanya query ditolak", () => {
    assert.equal(keyFromPublicUrl(`${BASE}/?x=1`), null);
  });

  test("hanya fragment ditolak", () => {
    assert.equal(keyFromPublicUrl(`${BASE}/#frag`), null);
  });

  test("query kosong setelah slash ditolak", () => {
    assert.equal(keyFromPublicUrl(`${BASE}/?`), null);
  });

  test("query dan hash dibuang dari key yang sah", () => {
    assert.equal(
      keyFromPublicUrl(`${BASE}/projects/123-foto.jpg?x=1`),
      "projects/123-foto.jpg",
    );
    assert.equal(
      keyFromPublicUrl(`${BASE}/projects/123-foto.jpg#frag`),
      "projects/123-foto.jpg",
    );
    assert.equal(
      keyFromPublicUrl(`${BASE}/projects/123-foto.jpg?x=1#frag`),
      "projects/123-foto.jpg",
    );
  });

  test("query berisi upaya traversal tidak menyelamatkan key", () => {
    assert.equal(keyFromPublicUrl(`${BASE}/?file=../../secret`), null);
  });
});

describe("keyFromPublicUrl — encoding tidak sah", () => {
  test("persen tunggal dan escape rusak ditolak, bukan melempar", () => {
    for (const bad of [`${BASE}/%`, `${BASE}/%zz`, `${BASE}/%2`, `${BASE}/a%zzb.jpg`]) {
      assert.equal(keyFromPublicUrl(bad), null, `${bad} seharusnya null`);
    }
  });

  test("spasi dan karakter sah tetap di-decode", () => {
    assert.equal(keyFromPublicUrl(`${BASE}/a%2Fb.jpg`), "a/b.jpg");
    assert.equal(keyFromPublicUrl(`${BASE}/projects%2F123-foto.jpg`), "projects/123-foto.jpg");
  });

  test("spasi mentah maupun ter-encode ditolak (bukan bentuk key yang sah)", () => {
    for (const bad of [
      `${BASE}/foto%20spasi.jpg`,
      `${BASE}/a b.jpg`,
      `${BASE}/a%09b.jpg`,
      `${BASE}/a%00b.jpg`,
    ]) {
      assert.equal(keyFromPublicUrl(bad), null, `${bad} seharusnya null`);
    }
  });
});

describe("keyFromPublicUrl — invarian keamanan", () => {
  test("key yang dikembalikan tidak pernah mengandung '..'", () => {
    const candidates = [
      ...HOSTILE_URLS.map((entry) => entry.url),
      `${BASE}/projects/123-foto.jpg`,
      `${BASE}/foto%20spasi.jpg`,
      `${BASE}/a%2Fb.jpg`,
      `${BASE}/%252e%252e%252fsecret`,
      `${BASE}/projects/..hidden/x.jpg`,
      `${BASE}/.hidden/x.jpg`,
      `${BASE}/a/./b.jpg`,
    ];
    for (const url of candidates) {
      const key = keyFromPublicUrl(url);
      assert.ok(
        key === null || !key.includes(".."),
        `key ${JSON.stringify(key)} dari ${url} mengandung '..'`,
      );
    }
  });

  test("key yang dikembalikan tidak pernah kosong", () => {
    const candidates = [
      ...HOSTILE_URLS.map((entry) => entry.url),
      `${BASE}/projects/123-foto.jpg`,
      `${BASE}/a%2Fb.jpg`,
      `${BASE}//projects//a.jpg`,
    ];
    for (const url of candidates) {
      const key = keyFromPublicUrl(url);
      if (key === null) continue;
      assert.ok(key.length > 0, `key kosong dari ${url}`);
    }
  });

  // Diperketat: URL dengan garis miring ganda setelah base dulu menghasilkan key
  // berawalan "/" (`<base>//projects//a.jpg` -> "/projects//a.jpg"). Key seperti itu
  // bukan bentuk yang dihasilkan `createPresignedUpload`, dan karena fungsi ini
  // memutuskan penghapusan objek R2, bentuk cacat sekarang ditolak (fail-closed).
  test("garis miring ganda dan segmen kosong ditolak", () => {
    assert.equal(keyFromPublicUrl(`${BASE}//projects//a.jpg`), null);
    assert.equal(keyFromPublicUrl(`${BASE}///a.jpg`), null);
    assert.equal(keyFromPublicUrl(`${BASE}/projects//a.jpg`), null);
    assert.equal(keyFromPublicUrl(`${BASE}/projects/a.jpg/`), null);
    assert.equal(keyFromPublicUrl(`${BASE}/%2Fprojects%2Fa.jpg`), null);
  });

  test("tanpa base URL tidak ada key yang dikembalikan (fail-closed)", () => {
    delete process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
    assert.equal(keyFromPublicUrl(`${BASE}/projects/a.jpg`), null);
    assert.equal(keyFromPublicUrl(`${BASE}/%2e%2e%2fsecret`), null);
  });

  test("base dengan garis miring di ujung tetap cocok", () => {
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL = `${BASE}/`;
    assert.equal(keyFromPublicUrl(`${BASE}/projects/a.jpg`), "projects/a.jpg");
    assert.equal(keyFromPublicUrl(`${BASE}/%2e%2e%2fsecret`), null);
  });

  test("domain yang hanya berawalan sama tetap ditolak", () => {
    for (const bad of [
      "https://cdn.example.com.evil.com/projects/a.jpg",
      "https://cdn.example.com@evil.com/projects/a.jpg",
      "https://evil.com/https://cdn.example.com/projects/a.jpg",
    ]) {
      assert.equal(keyFromPublicUrl(bad), null, `${bad} seharusnya null`);
    }
  });
});
