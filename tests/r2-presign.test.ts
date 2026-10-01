import { test, describe, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { createPresignedUpload, deleteR2Object } from "../src/lib/r2.ts";

// ---------------------------------------------------------------------------
// Tes ini mengimpor modul NYATA `src/lib/r2.ts` dan menjalankan penandatanganan
// SigV4 sungguhan secara lokal (aws4fetch), tanpa jaringan: `createPresignedUpload`
// hanya menghitung tanda tangan, tidak pernah memanggil R2.
//
// Batas cakupan yang disengaja:
// - Handler route `src/app/api/upload/presign/route.ts` TIDAK diuji di sini.
//   Handler itu memanggil `requireUser()` -> `cookies()` dari `next/headers`,
//   yang melempar "`cookies` was called outside a request scope" di luar request
//   scope Next.js. Menguji allowlist tipe/folder milik route butuh request scope
//   atau `mock.module` (butuh flag `--experimental-test-module-mocks`, dan flag
//   itu tidak bisa dipasang lewat NODE_OPTIONS). Jadi allowlist route hanya
//   diverifikasi lewat pembacaan kode, bukan lewat tes — jangan diklaim teruji.
// - Yang dikunci di sini adalah properti KEAMANAN dari nilai yang dikembalikan
//   `createPresignedUpload`: bentuk key, cakupan header yang ditandatangani,
//   masa berlaku, dan perilaku gagal-tertutup saat konfigurasi kurang.
// ---------------------------------------------------------------------------

const ENV_KEYS = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "NEXT_PUBLIC_R2_PUBLIC_URL",
] as const;

type EnvKey = (typeof ENV_KEYS)[number];

const ORIGINAL: Partial<Record<EnvKey, string | undefined>> = {};

const ACCOUNT_ID = "acc123";
const BUCKET = "bucket";
const PUBLIC_BASE = "https://cdn.example.com";

function setConfiguredEnv(): void {
  process.env.R2_ACCOUNT_ID = ACCOUNT_ID;
  process.env.R2_ACCESS_KEY_ID = "AKIAEXAMPLE";
  process.env.R2_SECRET_ACCESS_KEY = "secret";
  process.env.R2_BUCKET_NAME = BUCKET;
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL = PUBLIC_BASE;
}

before(() => {
  for (const key of ENV_KEYS) ORIGINAL[key] = process.env[key];
});

after(() => {
  for (const key of ENV_KEYS) {
    const value = ORIGINAL[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

beforeEach(() => {
  setConfiguredEnv();
});

/** Bagian key setelah prefix folder (segmen yang berasal dari filename). */
function basename(key: string): string {
  const parts = key.split("/");
  return parts[parts.length - 1];
}

describe("createPresignedUpload — bentuk key dan URL", () => {
  test("key memakai prefix folder dan URL objek menyertakan bucket", async () => {
    const result = await createPresignedUpload({
      filename: "foto.png",
      contentType: "image/png",
      folder: "projects",
    });

    assert.match(result.key, /^projects\//);

    const url = new URL(result.url);
    assert.equal(url.host, `${ACCOUNT_ID}.r2.cloudflarestorage.com`);
    assert.ok(
      url.pathname.startsWith(`/${BUCKET}/`),
      `pathname harus di dalam bucket, dapat: ${url.pathname}`,
    );
  });

  test("tanpa folder, key tidak punya prefix folder", async () => {
    const result = await createPresignedUpload({
      filename: "foto.png",
      contentType: "image/png",
    });
    assert.ok(!result.key.includes("/"), `key tanpa folder: ${result.key}`);
  });

  test("publicUrl = base publik + key, garis miring di ujung base dinormalkan", async () => {
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL = `${PUBLIC_BASE}/`;
    const result = await createPresignedUpload({
      filename: "foto.png",
      contentType: "image/png",
    });
    assert.equal(result.publicUrl, `${PUBLIC_BASE}/${result.key}`);
  });

  test("dua panggilan menghasilkan key berbeda (tidak ada tabrakan nama)", async () => {
    const a = await createPresignedUpload({ filename: "f.png", contentType: "image/png" });
    const b = await createPresignedUpload({ filename: "f.png", contentType: "image/png" });
    assert.notEqual(a.key, b.key);
  });
});

describe("createPresignedUpload — masa berlaku tanda tangan", () => {
  test("X-Amz-Expires = 3600 detik", async () => {
    const result = await createPresignedUpload({
      filename: "f.png",
      contentType: "image/png",
    });
    assert.equal(new URL(result.url).searchParams.get("X-Amz-Expires"), "3600");
  });

  test("URL berisi tanda tangan dan kredensial akses", async () => {
    const result = await createPresignedUpload({
      filename: "f.png",
      contentType: "image/png",
    });
    const params = new URL(result.url).searchParams;
    assert.ok(params.get("X-Amz-Signature"), "X-Amz-Signature harus ada");
    assert.equal(params.get("X-Amz-Algorithm"), "AWS4-HMAC-SHA256");
  });
});

describe("createPresignedUpload — Content-Type ikut ditandatangani", () => {
  // Regresi untuk `allHeaders: true`. Tanpa opsi itu, aws4fetch membuang
  // Content-Type dari daftar header yang ditandatangani, sehingga pemegang URL
  // bisa PUT objek dengan Content-Type apa pun (mis. text/html) dan R2
  // menyimpannya apa adanya — jalur menuju stored XSS lewat domain publik.
  test("X-Amz-SignedHeaders memuat content-type", async () => {
    const result = await createPresignedUpload({
      filename: "f.png",
      contentType: "image/png",
    });
    const signed = new URL(result.url).searchParams.get("X-Amz-SignedHeaders") ?? "";
    assert.match(
      signed,
      /(^|;)content-type(;|$)/i,
      `content-type harus ditandatangani, dapat: ${signed}`,
    );
  });

  test("content-type yang berbeda menghasilkan tanda tangan berbeda", async () => {
    const png = await createPresignedUpload({
      filename: "f.png",
      contentType: "image/png",
    });
    const html = await createPresignedUpload({
      filename: "f.png",
      contentType: "text/html",
    });
    const sigOf = (u: string) => new URL(u).searchParams.get("X-Amz-Signature");
    assert.notEqual(sigOf(png.url), sigOf(html.url));
  });
});

describe("createPresignedUpload — sanitasi filename", () => {
  const HOSTILE_FILENAMES = [
    "../../etc/passwd",
    "..%2f..%2fetc",
    "a/../../b.png",
    "..",
    "/etc/passwd",
    "C:\\Windows\\win.ini",
    "foto\nbaru.png",
    "x\u0000.png",
  ];

  test("filename tidak bisa menambah segmen path ke key", async () => {
    // Asersi WAJIB pada `key`, bukan pada `URL.pathname`: `new URL()` menormalkan
    // segmen `..` secara diam-diam, sehingga pathname yang tampak aman justru
    // menyembunyikan escape (`/bucket/projects/x-a/../../b.png` -> `/bucket/b.png`).
    // Mutasi yang mengizinkan `/` lolos di filename terbukti lolos dari asersi
    // berbasis pathname; asersi pada key di bawah ini yang menangkapnya.
    for (const filename of HOSTILE_FILENAMES) {
      const result = await createPresignedUpload({ filename, contentType: "image/png" });
      assert.ok(
        !result.key.includes("/"),
        `filename ${filename} menambah segmen path: ${result.key}`,
      );
      assert.ok(!result.key.includes("\\"), `filename ${filename} -> key ${result.key}`);
      assert.ok(!result.key.includes("\u0000"), `filename ${filename} -> key ${result.key}`);
    }
  });

  test("filename hostile tidak bisa keluar dari prefix folder", async () => {
    for (const filename of HOSTILE_FILENAMES) {
      const result = await createPresignedUpload({
        filename,
        contentType: "image/png",
        folder: "projects",
      });
      const name = result.key.slice("projects/".length);
      assert.ok(
        !name.includes("/"),
        `filename ${filename} menambah segmen di dalam folder: ${result.key}`,
      );
    }
  });

  test("key tidak pernah memuat segmen '..'", async () => {
    for (const filename of HOSTILE_FILENAMES) {
      const result = await createPresignedUpload({ filename, contentType: "image/png" });
      const segments = result.key.split("/");
      assert.ok(
        !segments.includes("..") && !segments.includes("."),
        `key memuat segmen navigasi: ${result.key}`,
      );
    }
  });

  test("filename dipertahankan sebagai bagian key yang terbaca", async () => {
    const result = await createPresignedUpload({
      filename: "foto-produk.png",
      contentType: "image/png",
    });
    assert.ok(
      basename(result.key).endsWith("foto-produk.png"),
      `basename: ${basename(result.key)}`,
    );
  });
});

describe("createPresignedUpload — perilaku folder (catatan pertahanan berlapis)", () => {
  // `createPresignedUpload` TIDAK menyanitasi `folder`; ia hanya memangkas
  // garis miring di ujung. Jadi `folder` adalah parameter yang HARUS sudah
  // divalidasi pemanggil. Satu-satunya pemanggil di repo ini adalah route
  // presign, dan route itu menolak folder di luar allowlist
  // `ALLOWED_FOLDERS = {projects, certifications, gallery, test}` dengan 400
  // SEBELUM memanggil fungsi ini (lihat src/app/api/upload/presign/route.ts).
  //
  // Tes di bawah mengunci kenyataan itu supaya asumsi "route adalah gate-nya"
  // terlihat eksplisit: bila kelak route meneruskan folder mentah dari user,
  // tes ini menjelaskan mengapa itu berbahaya.
  test("folder diteruskan apa adanya (pemanggil wajib allowlist)", async () => {
    const result = await createPresignedUpload({
      filename: "f.png",
      contentType: "image/png",
      folder: "projects/../../etc",
    });
    assert.ok(
      result.key.startsWith("projects/../../etc/"),
      `folder tidak disanitasi di r2.ts, dapat: ${result.key}`,
    );
  });

  test("folder dengan garis miring di ujung dipangkas", async () => {
    const result = await createPresignedUpload({
      filename: "f.png",
      contentType: "image/png",
      folder: "/projects/",
    });
    assert.ok(result.key.startsWith("projects/"), `key: ${result.key}`);
  });

  test("folder kosong sama dengan tanpa folder", async () => {
    const result = await createPresignedUpload({
      filename: "f.png",
      contentType: "image/png",
      folder: "",
    });
    assert.ok(!result.key.includes("/"), `key: ${result.key}`);
  });
});

describe("createPresignedUpload — gagal-tertutup saat konfigurasi kurang", () => {
  const REQUIRED: ReadonlyArray<EnvKey> = [
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET_NAME",
    "NEXT_PUBLIC_R2_PUBLIC_URL",
  ];

  for (const key of REQUIRED) {
    test(`${key} hilang -> melempar, tidak mengembalikan URL tanpa tanda tangan`, async () => {
      delete process.env[key];
      await assert.rejects(
        () => createPresignedUpload({ filename: "f.png", contentType: "image/png" }),
        (err: unknown) => err instanceof Error && /not configured/i.test(err.message),
      );
    });
  }

  test("kredensial kosong (string kosong) juga ditolak", async () => {
    process.env.R2_ACCESS_KEY_ID = "";
    await assert.rejects(() =>
      createPresignedUpload({ filename: "f.png", contentType: "image/png" }),
    );
  });
});

describe("deleteR2Object — gagal-tertutup tanpa konfigurasi", () => {
  // Hanya jalur yang melempar SEBELUM fetch yang diuji, supaya tidak ada
  // permintaan jaringan sungguhan ke R2 dari dalam suite.
  test("tanpa kredensial melempar sebelum menyentuh jaringan", async () => {
    delete process.env.R2_SECRET_ACCESS_KEY;
    await assert.rejects(
      () => deleteR2Object("projects/x.png"),
      (err: unknown) => err instanceof Error && /not configured/i.test(err.message),
    );
  });

  test("tanpa bucket melempar sebelum menyentuh jaringan", async () => {
    delete process.env.R2_BUCKET_NAME;
    await assert.rejects(
      () => deleteR2Object("projects/x.png"),
      (err: unknown) => err instanceof Error && /R2_BUCKET_NAME is not configured/.test(err.message),
    );
  });
});
