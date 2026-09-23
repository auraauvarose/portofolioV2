// Test untuk normalisasi ringkasan analitik: respons API yang tidak lengkap
// (chunk lama / field baru belum ada) tidak boleh membuat panel crash.
import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeSummary } from "../src/lib/analytics-summary";

test("respons lengkap → diteruskan apa adanya", () => {
  const s = normalizeSummary({
    migrated: true,
    days: 30,
    total: 5,
    unique: 3,
    byDay: [{ date: "2026-02-12", count: 5 }],
    topPaths: [{ label: "/", count: 5 }],
    topReferrers: [],
    byDevice: [{ label: "mobile", count: 4 }],
    byHour: [{ hour: 14, count: 5 }],
    topLocations: [{ label: "Jakarta, ID", count: 5 }],
    recentVisits: [
      { path: "/", device: "Ponsel", location: "Jakarta, ID", time: "14:32 WIB · 12 Feb" },
    ],
  });
  assert.equal(s.total, 5);
  assert.equal(s.byDevice.length, 1);
  assert.equal(s.recentVisits.length, 1);
  assert.equal(s.recentVisits[0].device, "Ponsel");
});

test("field array hilang → jadi array kosong, bukan undefined", () => {
  const s = normalizeSummary({ migrated: true, total: 2 });
  assert.deepEqual(s.byDay, []);
  assert.deepEqual(s.byDevice, []);
  assert.deepEqual(s.byBrowser, []);
  assert.deepEqual(s.byPhoneBrand, []);
  assert.deepEqual(s.byHour, []);
  assert.deepEqual(s.topLocations, []);
  assert.deepEqual(s.recentVisits, []);
});

test("field array bertipe salah → jadi array kosong", () => {
  const s = normalizeSummary({
    migrated: true,
    byDevice: "bukan-array",
    byBrowser: "bukan-array",
    byPhoneBrand: 42,
    byHour: null,
    recentVisits: 42,
  });
  assert.deepEqual(s.byDevice, []);
  assert.deepEqual(s.byBrowser, []);
  assert.deepEqual(s.byPhoneBrand, []);
  assert.deepEqual(s.byHour, []);
  assert.deepEqual(s.recentVisits, []);
});

test("byBrowser & byPhoneBrand → diteruskan sebagai daftar berlabel", () => {
  const s = normalizeSummary({
    migrated: true,
    byBrowser: [{ label: "Chrome", count: 9 }],
    byPhoneBrand: [{ label: "Samsung", count: 4 }],
  });
  assert.deepEqual(s.byBrowser, [{ label: "Chrome", count: 9 }]);
  assert.deepEqual(s.byPhoneBrand, [{ label: "Samsung", count: 4 }]);
});

test("angka hilang/NaN → 0, days default 30", () => {
  const s = normalizeSummary({ migrated: true, total: Number.NaN });
  assert.equal(s.total, 0);
  assert.equal(s.unique, 0);
  assert.equal(s.days, 30);
});

test("recentVisits: entri cacat dibuang, entri valid tetap ada", () => {
  const s = normalizeSummary({
    migrated: true,
    recentVisits: [
      { path: "/a", device: "Ponsel", location: "ID", time: "01:00 WIB · 1 Jan" },
      null,
      "bukan-objek",
      { device: "Tablet" },
    ],
  });
  assert.equal(s.recentVisits.length, 1);
  assert.equal(s.recentVisits[0].path, "/a");
});

test("migrated tidak ada → false (aman: panel menampilkan notice migrasi)", () => {
  const s = normalizeSummary({});
  assert.equal(s.migrated, false);
});

test("input null/undefined → ringkasan kosong yang aman", () => {
  for (const input of [null, undefined]) {
    const s = normalizeSummary(input);
    assert.equal(s.total, 0);
    assert.deepEqual(s.recentVisits, []);
  }
});
