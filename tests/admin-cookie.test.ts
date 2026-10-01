import { test, describe, mock } from "node:test";
import assert from "node:assert/strict";

import {
  ADMIN_COOKIE,
  SESSION_TTL_SECONDS,
  createSessionValue,
  verifySessionValue,
} from "../src/lib/admin-cookie.ts";

const SECRET_A = "secret-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const SECRET_B = "secret-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

const FIXED_NOW_MS = 1_700_000_000_000;

/** Jalankan fn dengan Date.now() dibekukan, lalu pulihkan jam asli. */
async function withFrozenClock<T>(
  nowMs: number,
  fn: () => Promise<T>,
): Promise<T> {
  mock.timers.enable({ apis: ["Date"], now: nowMs });
  try {
    return await fn();
  } finally {
    mock.timers.reset();
  }
}

function expOf(token: string): number {
  return Number(token.slice(0, token.indexOf(".")));
}

function sigOf(token: string): string {
  return token.slice(token.indexOf(".") + 1);
}

describe("konstanta sesi admin", () => {
  test("nama cookie stabil (dipakai middleware, admin-auth, dan route login)", () => {
    assert.equal(ADMIN_COOKIE, "admin_session");
  });

  test("TTL sesi tujuh hari", () => {
    assert.equal(SESSION_TTL_SECONDS, 60 * 60 * 24 * 7);
  });
});

describe("createSessionValue", () => {
  test("menghasilkan exp + tanda tangan 64 hex", async () => {
    const token = await createSessionValue(SECRET_A);
    assert.match(token, /^\d+\.[0-9a-f]{64}$/);
  });

  test("exp = waktu sekarang + TTL, bukan nilai liar dari klien", async () => {
    await withFrozenClock(FIXED_NOW_MS, async () => {
      const token = await createSessionValue(SECRET_A);
      assert.equal(expOf(token), Math.floor(FIXED_NOW_MS / 1000) + SESSION_TTL_SECONDS);
    });
  });

  test("tanpa secret tidak menerbitkan sesi (fail-closed)", async () => {
    assert.equal(await createSessionValue(""), "");
  });

  test("dua token dari secret sama berbeda exp-nya bila jam bergerak", async () => {
    const first = await withFrozenClock(FIXED_NOW_MS, () =>
      createSessionValue(SECRET_A),
    );
    const second = await withFrozenClock(FIXED_NOW_MS + 2000, () =>
      createSessionValue(SECRET_A),
    );
    assert.equal(expOf(second), expOf(first) + 2);
    assert.notEqual(sigOf(second), sigOf(first));
  });
});

describe("verifySessionValue — token sah", () => {
  test("token yang baru dibuat diterima", async () => {
    const token = await createSessionValue(SECRET_A);
    assert.equal(await verifySessionValue(SECRET_A, token), true);
  });

  test("verifikasi konsisten bila diulang", async () => {
    const token = await createSessionValue(SECRET_A);
    const results = await Promise.all([
      verifySessionValue(SECRET_A, token),
      verifySessionValue(SECRET_A, token),
      verifySessionValue(SECRET_A, token),
    ]);
    assert.deepEqual(results, [true, true, true]);
  });

  test("token tetap sah satu detik sebelum kedaluwarsa", async () => {
    await withFrozenClock(FIXED_NOW_MS, async () => {
      const token = await createSessionValue(SECRET_A);
      const exp = expOf(token);
      mock.timers.setTime(exp * 1000 - 1);
      assert.equal(await verifySessionValue(SECRET_A, token), true);
    });
  });
});

describe("verifySessionValue — penolakan", () => {
  test("token dari secret A ditolak oleh secret B", async () => {
    const token = await createSessionValue(SECRET_A);
    assert.equal(await verifySessionValue(SECRET_B, token), false);
  });

  test("token kedaluwarsa ditolak (exp sudah lewat)", async () => {
    await withFrozenClock(FIXED_NOW_MS, async () => {
      const token = await createSessionValue(SECRET_A);
      const exp = expOf(token);
      mock.timers.setTime(exp * 1000 + 60_000);
      assert.equal(await verifySessionValue(SECRET_A, token), false);
    });
  });

  test("tepat pada detik exp token sudah tidak sah (tidak ada toleransi)", async () => {
    await withFrozenClock(FIXED_NOW_MS, async () => {
      const token = await createSessionValue(SECRET_A);
      mock.timers.setTime(expOf(token) * 1000);
      assert.equal(await verifySessionValue(SECRET_A, token), false);
    });
  });

  test("secret kosong tidak pernah memvalidasi apa pun", async () => {
    const token = await createSessionValue(SECRET_A);
    assert.equal(await verifySessionValue("", token), false);
  });

  test("nilai kosong / null / undefined ditolak", async () => {
    assert.equal(await verifySessionValue(SECRET_A, ""), false);
    assert.equal(await verifySessionValue(SECRET_A, null), false);
    assert.equal(await verifySessionValue(SECRET_A, undefined), false);
  });

  test("format cacat ditolak", async () => {
    const bad: (string | null | undefined)[] = [
      "",
      "abc",
      "abc.def",
      "123.",
      ".abc",
      "abc.def.ghi",
      ".",
      "..",
      "123..",
      "1e3." + "a".repeat(64),
      " 123." + "a".repeat(64),
      "-123." + "a".repeat(64),
      "12 3." + "a".repeat(64),
      "0x10." + "a".repeat(64),
      "123." + "A".repeat(64),
      "123." + "a".repeat(63),
      "123." + "a".repeat(65),
      "123." + "z".repeat(64),
      "123.abc",
      "123.def",
      ".".repeat(200),
      "123." + "a".repeat(64) + " ",
    ];
    for (const value of bad) {
      assert.equal(
        await verifySessionValue(SECRET_A, value),
        false,
        `harus menolak ${JSON.stringify(value)}`,
      );
    }
  });

  test("exp di luar safe integer ditolak walau tanda tangannya benar", async () => {
    const token = await createSessionValue(SECRET_A);
    const sig = sigOf(token);
    assert.equal(
      await verifySessionValue(SECRET_A, `99999999999999999999.${sig}`),
      false,
    );
  });

  test("exp yang diubah membatalkan tanda tangan asli", async () => {
    const token = await createSessionValue(SECRET_A);
    const sig = sigOf(token);
    const tampered = `${expOf(token) + 60 * 60 * 24 * 30}.${sig}`;
    assert.equal(await verifySessionValue(SECRET_A, tampered), false);
  });

  test("satu karakter tanda tangan yang diubah sudah cukup untuk menolak", async () => {
    const token = await createSessionValue(SECRET_A);
    const sig = sigOf(token);
    const flipped = (sig[0] === "0" ? "1" : "0") + sig.slice(1);
    assert.equal(flipped.length, sig.length);
    assert.equal(
      await verifySessionValue(SECRET_A, `${expOf(token)}.${flipped}`),
      false,
    );
  });

  test("tanda tangan dari secret lain dengan exp yang sama ditolak", async () => {
    const tokenA = await createSessionValue(SECRET_A);
    const tokenB = await createSessionValue(SECRET_B);
    assert.equal(
      await verifySessionValue(SECRET_A, `${expOf(tokenA)}.${sigOf(tokenB)}`),
      false,
    );
  });
});
