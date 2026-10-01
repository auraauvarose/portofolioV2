import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";

import { POST, PATCH, DELETE } from "../src/app/api/comments/route.ts";

// ---------------------------------------------------------------------------
// Tes ini memanggil handler route NYATA `src/app/api/comments/route.ts`.
//
// Handler di route ini dibungkus `withJsonErrors`, sehingga bertanda tangan
// `(req, context)` — berbeda dari `src/app/api/admin/login/route.ts` yang
// bertanda tangan `(req)` saja. Tes di sini tidak memakai parameter route
// dinamis, jadi context diisi objek kosong.
//
// Batas cakupan (sengaja, bukan kelalaian):
// - Hanya jalur yang selesai SEBELUM menyentuh Supabase yang diasersikan:
//   validasi input, honeypot, rate-limit, dan urutan gate admin. Semuanya
//   deterministik tanpa DB.
// - Jalur tulis yang berhasil (`approved: false` saat insert) TIDAK diuji: butuh
//   Supabase sungguhan, dan di lingkungan tes `createSupabaseAdmin()` gagal
//   sehingga handler mengembalikan 500 lewat `withJsonErrors`. Karena itu status
//   500 TIDAK pernah diasersikan sebagai perilaku yang diinginkan.
// - Status 401 pada gate admin juga tidak bisa diasersikan: di luar request scope
//   Next.js, `cookies()` melempar dan `withJsonErrors` mengubahnya menjadi 500.
//   Gate tetap BISA diuji lewat urutannya — lihat describe terakhir.
// ---------------------------------------------------------------------------

const EMPTY_CONTEXT = {};

let ipCounter = 0;
/** IP unik per pemanggilan: `rateMap` di modul route bersifat proses-global. */
function freshIp(): string {
  ipCounter += 1;
  return `198.51.100.${ipCounter % 250}.${Math.floor(ipCounter / 250)}`;
}

function post(body: unknown, ip: string = freshIp()): Promise<Response> {
  return POST(
    new NextRequest("https://example.test/api/comments", {
      method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": ip },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
    EMPTY_CONTEXT,
  );
}

describe("POST /api/comments — validasi input ditolak sebelum menyentuh DB", () => {
  test("body bukan JSON valid -> 400, bukan 500", async () => {
    const res = await post("{bukan json");
    assert.equal(res.status, 400);
  });

  test("body null / string / number -> 400", async () => {
    for (const body of ["null", '"teks"', "42", "[]"]) {
      const res = await post(body);
      assert.equal(res.status, 400, `body ${body} seharusnya 400`);
    }
  });

  test("nama kosong atau hanya spasi -> 400", async () => {
    for (const name of ["", "   ", "\t\n"]) {
      const res = await post({ name, message: "pesan yang cukup panjang" });
      assert.equal(res.status, 400, `nama ${JSON.stringify(name)} seharusnya 400`);
    }
  });

  test("nama hilang sama sekali -> 400", async () => {
    const res = await post({ message: "pesan yang cukup panjang" });
    assert.equal(res.status, 400);
  });

  test("pesan kurang dari 2 karakter -> 400", async () => {
    for (const message of ["", "a", "   "]) {
      const res = await post({ name: "Budi", message });
      assert.equal(res.status, 400, `pesan ${JSON.stringify(message)} seharusnya 400`);
    }
  });

  test("email berformat salah -> 400", async () => {
    for (const email of ["bukan-email", "a@b", "a@b.c", "@example.com", "a b@example.com"]) {
      const res = await post({ name: "Budi", message: "pesan bagus", email });
      assert.equal(res.status, 400, `email ${email} seharusnya 400`);
    }
  });

  test("email kosong diperbolehkan (tidak wajib)", async () => {
    // Email kosong lolos validasi; permintaan lanjut ke Supabase dan gagal di
    // sana pada lingkungan tes. Yang dikunci: BUKAN 400 karena format email.
    const res = await post({ name: "Budi", message: "pesan bagus", email: "" });
    assert.notEqual(res.status, 400);
  });
});

describe("POST /api/comments — honeypot anti-spam", () => {
  // Honeypot: field `website` tidak pernah diisi manusia. Bila terisi, handler
  // berpura-pura sukses (201) TANPA menyimpan apa pun — jadi tidak ada umpan
  // balik yang memberi tahu bot bahwa ia terdeteksi.
  test("website terisi -> 201 palsu tanpa menyentuh DB", async () => {
    const res = await post({
      name: "Budi",
      message: "pesan bagus",
      website: "http://spam.example",
    });
    assert.equal(res.status, 201);
    const body = (await res.json()) as { ok?: boolean };
    assert.equal(body.ok, true);
  });

  test("website berisi spasi saja dianggap terisi -> 201 palsu", async () => {
    // `clean()` memangkas spasi di ujung; "  x  " menjadi "x" sehingga dianggap
    // terisi. Ini menutup celah bot yang mengirim honeypot berisi spasi.
    const res = await post({
      name: "Budi",
      message: "pesan bagus",
      website: "  x  ",
    });
    assert.equal(res.status, 201);
  });

  test("respons honeypot tidak membocorkan id komentar", async () => {
    const res = await post({ name: "Budi", message: "pesan bagus", website: "spam" });
    const body = (await res.json()) as Record<string, unknown>;
    assert.equal(body.id, undefined);
    assert.deepEqual(Object.keys(body), ["ok"]);
  });
});

describe("POST /api/comments — rate limit per-IP", () => {
  test("permintaan kedua dari IP yang sama -> 429", async () => {
    const ip = freshIp();
    await post({ name: "Budi", message: "pesan bagus" }, ip);
    const second = await post({ name: "Budi", message: "pesan bagus" }, ip);
    assert.equal(second.status, 429);
  });

  test("IP berbeda tidak saling memblokir", async () => {
    const a = freshIp();
    const b = freshIp();
    await post({ name: "Budi", message: "pesan bagus" }, a);
    const other = await post({ name: "Budi", message: "pesan bagus" }, b);
    assert.notEqual(other.status, 429, "IP berbeda tidak boleh kena limit IP lain");
  });

  test("X-Forwarded-For tidak bisa dipakai melewati rate limit", async () => {
    // `clientIp()` sengaja mengabaikan X-Forwarded-For: Cloudflare menambahkan
    // IP-nya di BELAKANG daftar, jadi entri pertama berasal dari klien dan bisa
    // dipalsukan. Memutar XFF tidak boleh memberi kuota baru.
    const ip = freshIp();
    await post({ name: "Budi", message: "pesan bagus" }, ip);
    const res = await POST(
      new NextRequest("https://example.test/api/comments", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "cf-connecting-ip": ip,
          "x-forwarded-for": "1.2.3.4",
        },
        body: JSON.stringify({ name: "Budi", message: "pesan bagus" }),
      }),
      EMPTY_CONTEXT,
    );
    assert.equal(res.status, 429);
  });

  test("X-Real-IP dipakai bila CF-Connecting-IP tidak ada", async () => {
    const ip = freshIp();
    const mk = () =>
      new NextRequest("https://example.test/api/comments", {
        method: "POST",
        headers: { "content-type": "application/json", "x-real-ip": ip },
        body: JSON.stringify({ name: "Budi", message: "pesan bagus" }),
      });
    await POST(mk(), EMPTY_CONTEXT);
    const second = await POST(mk(), EMPTY_CONTEXT);
    assert.equal(second.status, 429);
  });
});

describe("PATCH/DELETE /api/comments — gate admin berjalan SEBELUM validasi body", () => {
  // Di luar request scope, `cookies()` (dipanggil `requireUser()`) melempar dan
  // `withJsonErrors` mengubahnya menjadi 500. Status 401 sebenarnya hanya muncul
  // di dalam request scope Next.js, jadi status spesifik TIDAK bisa diasersikan
  // di sini.
  //
  // Karena itu, asersi "status >= 400" saja TIDAK berguna: ia tetap lulus walau
  // gate admin dihapus total. (Terbukti lewat uji mutasi: menghapus dua baris
  // `requireUser()` membuat asersi lama tetap hijau.)
  //
  // Diskriminator yang benar adalah URUTAN: gate admin ada di awal handler,
  // sebelum body di-parse. Maka penyerang tanpa sesi tidak boleh pernah melihat
  // semantik validasi body — payload yang sengaja tidak valid harus mendapat
  // hasil yang SAMA dengan payload yang tampak valid, dan pesan validasi
  // ("Data tidak valid.", "id wajib diisi.", "ID tidak valid.", "approved harus
  // boolean.") tidak boleh bocor. Bila gate dihapus, payload tidak valid akan
  // mencapai validasi dan mengembalikan 400 + pesan tersebut, sehingga tes gagal.
  const VALIDATION_MESSAGES = [
    "Data tidak valid.",
    "id wajib diisi.",
    "ID tidak valid.",
    "approved harus boolean.",
  ];

  const UUID = "11111111-1111-1111-1111-111111111111";

  function patch(body: unknown): Promise<Response> {
    return PATCH(
      new NextRequest("https://example.test/api/comments", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
      EMPTY_CONTEXT,
    );
  }

  function del(query: string): Promise<Response> {
    return DELETE(
      new NextRequest(`https://example.test/api/comments${query}`, {
        method: "DELETE",
      }),
      EMPTY_CONTEXT,
    );
  }

  async function errorMessage(res: Response): Promise<string> {
    const body = (await res.json().catch(() => ({}))) as { error?: unknown };
    return typeof body.error === "string" ? body.error : "";
  }

  test("PATCH tanpa sesi tidak pernah sukses", async () => {
    const res = await patch({ id: UUID, approved: true });
    assert.ok(res.status >= 400, `PATCH tanpa sesi harus ditolak, dapat ${res.status}`);
  });

  test("PATCH: payload tidak valid tidak membocorkan pesan validasi", async () => {
    const res = await patch({ id: "bukan-uuid", approved: "ya" });
    const message = await errorMessage(res);
    assert.ok(
      !VALIDATION_MESSAGES.includes(message),
      `tanpa sesi, validasi body tidak boleh berjalan; dapat pesan ${JSON.stringify(message)}`,
    );
  });

  test("PATCH: payload valid dan tidak valid memberi hasil identik", async () => {
    // Bila gate admin ada, keduanya berhenti di gate yang sama. Bila gate
    // dihapus, payload tidak valid akan berhenti di validasi (400) sementara
    // yang valid lanjut ke Supabase (500) — sehingga tes ini gagal.
    const valid = await patch({ id: UUID, approved: true });
    const invalid = await patch({ id: "bukan-uuid", approved: "ya" });
    assert.equal(
      invalid.status,
      valid.status,
      "payload tidak valid tidak boleh menempuh jalur yang berbeda dari payload valid tanpa sesi",
    );
  });

  test("PATCH: body tidak valid pun tidak membocorkan pesan validasi", async () => {
    const res = await patch({ bukan: "field yang benar" });
    const message = await errorMessage(res);
    assert.ok(!VALIDATION_MESSAGES.includes(message), `bocor pesan: ${message}`);
  });

  test("DELETE tanpa sesi tidak pernah sukses", async () => {
    const res = await del(`?id=${UUID}`);
    assert.ok(res.status >= 400, `DELETE tanpa sesi harus ditolak, dapat ${res.status}`);
  });

  test("DELETE tanpa id tidak membocorkan pesan validasi", async () => {
    // `?id=` hilang adalah pelanggaran validasi yang jelas; tanpa sesi, pesan
    // "Missing id" / "id wajib diisi." tidak boleh sampai ke pemanggil.
    const res = await del("");
    const message = await errorMessage(res);
    assert.ok(
      !["Missing id", ...VALIDATION_MESSAGES].includes(message),
      `bocor pesan: ${message}`,
    );
  });

  test("DELETE: id valid dan id tidak valid memberi hasil identik tanpa sesi", async () => {
    const withValidId = await del(`?id=${UUID}`);
    const withInvalidId = await del("?id=bukan-uuid");
    assert.equal(
      withInvalidId.status,
      withValidId.status,
      "id tidak valid tidak boleh menempuh jalur berbeda dari id valid tanpa sesi",
    );
  });
});
