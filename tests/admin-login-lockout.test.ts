import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";

/**
 * Tes ini memanggil handler route NYATA (`src/app/api/admin/login/route.ts`),
 * bukan menyalin logikanya. Yang dikunci:
 *
 *  - gagal-tertutup saat server belum dikonfigurasi (503, bukan 500/200);
 *  - lockout per-IP setelah MAX_ATTEMPTS kegagalan, dan lockout itu TIDAK bisa
 *    dilewati dengan password yang benar;
 *  - header IP yang dipakai hanya yang tidak bisa dipalsukan klien.
 *
 * CATATAN CAKUPAN: jalur SUKSES penuh (200 + Set-Cookie) tidak bisa diuji di
 * luar request scope Next — `setAdminCookie` memanggil `cookies()`, yang melempar
 * "cookies was called outside a request scope". Karena itu jalur sukses di sini
 * hanya diverifikasi sampai membuktikan password benar LOLOS verifikasi (tidak
 * mengembalikan 401), bukan sampai cookie terpasang. Penulisan cookie diuji
 * secara terpisah lewat `createSessionValue` di tests/admin-cookie.test.ts.
 */

const ADMIN_PASSWORD = "password-admin-uji-yang-panjang";
const COOKIE_SECRET = "s".repeat(48);

const ORIGINAL_PASSWORD = process.env.ADMIN_PASSWORD;
const ORIGINAL_SECRET = process.env.ADMIN_COOKIE_SECRET;

function restoreEnv(): void {
  if (ORIGINAL_PASSWORD === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = ORIGINAL_PASSWORD;
  if (ORIGINAL_SECRET === undefined) delete process.env.ADMIN_COOKIE_SECRET;
  else process.env.ADMIN_COOKIE_SECRET = ORIGINAL_SECRET;
}

before(() => {
  process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
  process.env.ADMIN_COOKIE_SECRET = COOKIE_SECRET;
});

after(restoreEnv);

// Impor statis aman: handler membaca `adminPassword()`/`sessionSecret()` saat
// request diproses, bukan saat modul dimuat, jadi urutan env tidak berpengaruh.
import { POST } from "../src/app/api/admin/login/route.ts";

let ipCounter = 0;
/** IP unik per pemanggilan supaya bucket lockout antar-tes tidak tercampur. */
function freshIp(): string {
  ipCounter += 1;
  return `203.0.113.${ipCounter}`;
}

function login(
  password: unknown,
  ip: string,
  extraHeaders: Record<string, string> = {},
): NextRequest {
  return new NextRequest("https://example.com/api/admin/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "cf-connecting-ip": ip,
      ...extraHeaders,
    },
    body: JSON.stringify({ password }),
  });
}

async function jsonOf(res: Response): Promise<{ error?: string; ok?: boolean }> {
  return (await res.json()) as { error?: string; ok?: boolean };
}

describe("login admin — gagal-tertutup saat belum dikonfigurasi", () => {
  test("ADMIN_PASSWORD kosong -> 503, bukan 500 dan bukan 200", async () => {
    delete process.env.ADMIN_PASSWORD;
    try {
      const res = await POST(login("apa saja", freshIp()));
      assert.equal(res.status, 503);
      const body = await jsonOf(res);
      assert.match(String(body.error), /ADMIN_PASSWORD/);
      assert.equal(body.ok, undefined);
    } finally {
      process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
    }
  });

  test("ADMIN_COOKIE_SECRET kosong -> 503 walau password benar (fail-closed)", async () => {
    delete process.env.ADMIN_COOKIE_SECRET;
    try {
      const res = await POST(login(ADMIN_PASSWORD, freshIp()));
      assert.equal(res.status, 503);
      const body = await jsonOf(res);
      assert.match(String(body.error), /ADMIN_COOKIE_SECRET/);
    } finally {
      process.env.ADMIN_COOKIE_SECRET = COOKIE_SECRET;
    }
  });
});

describe("login admin — password salah", () => {
  test("password salah -> 401 dan tidak ada cookie sesi", async () => {
    const res = await POST(login("password-salah", freshIp()));
    assert.equal(res.status, 401);
    assert.equal(res.headers.get("set-cookie"), null);
    assert.match(String((await jsonOf(res)).error), /Password salah/);
  });

  test("password kosong -> 401", async () => {
    assert.equal((await POST(login("", freshIp()))).status, 401);
  });

  test("password non-string (number/object/array/null) -> 401", async () => {
    for (const value of [12345678, { password: ADMIN_PASSWORD }, [ADMIN_PASSWORD], null, true]) {
      const res = await POST(login(value, freshIp()));
      assert.equal(res.status, 401, `nilai ${JSON.stringify(value)} seharusnya 401`);
    }
  });

  test("body bukan JSON valid -> 401, bukan 500", async () => {
    const req = new NextRequest("https://example.com/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": freshIp() },
      body: "{ bukan json",
    });
    assert.equal((await POST(req)).status, 401);
  });

  test("body kosong tanpa content-type -> 401, bukan 500", async () => {
    const req = new NextRequest("https://example.com/api/admin/login", {
      method: "POST",
      headers: { "cf-connecting-ip": freshIp() },
    });
    assert.equal((await POST(req)).status, 401);
  });
});

describe("login admin — lockout per-IP", () => {
  const MAX_ATTEMPTS = 8;

  test("percobaan ke-1..8 -> 401, percobaan ke-9 -> 429 + Retry-After", async () => {
    const ip = freshIp();

    for (let i = 1; i <= MAX_ATTEMPTS; i++) {
      const res = await POST(login("password-salah", ip));
      assert.equal(res.status, 401, `percobaan ke-${i} seharusnya masih 401`);
    }

    const blocked = await POST(login("password-salah", ip));
    assert.equal(blocked.status, 429);
    assert.equal(blocked.headers.get("set-cookie"), null);

    const retryAfter = Number(blocked.headers.get("retry-after"));
    assert.ok(
      Number.isInteger(retryAfter) && retryAfter > 0 && retryAfter <= 900,
      `Retry-After harus detik yang masuk akal, dapat ${blocked.headers.get("retry-after")}`,
    );
    assert.match(String((await jsonOf(blocked)).error), /Terlalu banyak percobaan gagal/);
  });

  test("lockout TIDAK bisa dilewati dengan password yang benar", async () => {
    const ip = freshIp();
    for (let i = 0; i < MAX_ATTEMPTS; i++) await POST(login("password-salah", ip));

    const res = await POST(login(ADMIN_PASSWORD, ip));
    assert.equal(res.status, 429, "password benar tidak boleh membatalkan lockout");
    assert.equal(res.headers.get("set-cookie"), null);
  });

  test("lockout bersifat per-IP, bukan global", async () => {
    const blockedIp = freshIp();
    for (let i = 0; i < MAX_ATTEMPTS; i++) await POST(login("password-salah", blockedIp));
    assert.equal((await POST(login("password-salah", blockedIp))).status, 429);

    const otherIp = freshIp();
    const res = await POST(login("password-salah", otherIp));
    assert.equal(res.status, 401, "IP lain tidak boleh ikut terkunci");
  });

  test("X-Forwarded-For tidak bisa dipakai memalsukan IP untuk lepas lockout", async () => {
    const ip = freshIp();
    for (let i = 0; i < MAX_ATTEMPTS; i++) await POST(login("password-salah", ip));

    const res = await POST(
      login("password-salah", ip, { "x-forwarded-for": "198.51.100.7" }),
    );
    assert.equal(res.status, 429, "X-Forwarded-For harus diabaikan (bisa dipalsukan klien)");
  });

  test("X-Real-IP dipakai bila CF-Connecting-IP tidak ada", async () => {
    const req = new NextRequest("https://example.com/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json", "x-real-ip": freshIp() },
      body: JSON.stringify({ password: "password-salah" }),
    });
    assert.equal((await POST(req)).status, 401);
  });

  test("tanpa header IP sama sekali tetap diproses (bucket 'unknown')", async () => {
    const req = new NextRequest("https://example.com/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: "password-salah" }),
    });
    const res = await POST(req);
    assert.ok([401, 429].includes(res.status), `dapat status tak terduga ${res.status}`);
  });
});

describe("login admin — password benar lolos verifikasi", () => {
  test("password benar tidak ditolak 401 (berhenti di penulisan cookie di luar request scope)", async () => {
    // Bila password salah, handler MENGEMBALIKAN Response 401. Bila password
    // benar, handler lanjut ke setAdminCookie yang memanggil cookies() dan
    // melempar di luar request scope. Jadi `rejects` di sini membuktikan
    // verifikasi password berhasil — tanpa bergantung pesan error Next.
    await assert.rejects(async () => {
      await POST(login(ADMIN_PASSWORD, freshIp()));
    }, "password benar seharusnya lolos verifikasi dan lanjut ke penulisan cookie");
  });
});
