import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { slugify, isValidSlug, normalizeSlug } from "../src/lib/slug.ts";

/**
 * Berkas ini menguji permukaan slug sebagai gerbang keamanan: nilai ini dipakai
 * di URL publik (`/work/<slug>`) dan di query ke database.
 *
 * Catatan cakupan: `slugify` dipotong buta di 80 karakter, sehingga masukan yang
 * tanda hubungnya persis jatuh di batas itu bisa menyisakan hubung di ujung
 * (mis. `"a".repeat(79) + " b"`). Kasus batas itu sengaja TIDAK diklaim idempoten
 * di sini karena perilakunya memang belum dijamin; yang dikunci adalah jaminan
 * yang berlaku: `normalizeSlug` tidak pernah mengembalikan slug tidak valid.
 */

const HOSTILE_SLUGS: { value: string; why: string }[] = [
  { value: "", why: "string kosong" },
  { value: " ", why: "spasi tunggal" },
  { value: "portfolio dashboard", why: "spasi" },
  { value: "  portfolio-dashboard  ", why: "spasi di ujung" },
  { value: "Portfolio-Dashboard", why: "huruf besar" },
  { value: "PORTFOLIO", why: "huruf besar semua" },
  { value: "portfolio/Dashboard", why: "garis miring" },
  { value: "/portfolio", why: "garis miring di depan" },
  { value: "portfolio/", why: "garis miring di belakang" },
  { value: "/", why: "hanya garis miring" },
  { value: "..", why: "traversal titik-titik" },
  { value: "../", why: "traversal" },
  { value: "../../etc/passwd", why: "traversal absolut" },
  { value: "a/../b", why: "traversal di tengah" },
  { value: "%2e", why: "titik ter-encode" },
  { value: "%2e%2e", why: "traversal ter-encode" },
  { value: "%2e%2e%2f", why: "traversal ter-encode dengan garis miring" },
  { value: "%2f", why: "garis miring ter-encode" },
  { value: "portfolio%20dashboard", why: "spasi ter-encode" },
  { value: "%00", why: "byte nul ter-encode" },
  { value: "portfolio\0", why: "byte nul mentah" },
  { value: "日本語", why: "unicode non-latin" },
  { value: "café", why: "unicode berdiakritik" },
  { value: "naïve-slug", why: "unicode campur ascii" },
  { value: "portfolio\u00a0dashboard", why: "non-breaking space" },
  { value: "-portfolio", why: "hubung di depan" },
  { value: "portfolio-", why: "hubung di belakang" },
  { value: "portfolio--dashboard", why: "hubung ganda" },
  { value: "portfolio<script>", why: "upaya injeksi tag" },
  { value: "portfolio'; DROP TABLE projects; --", why: "upaya injeksi SQL" },
  { value: "portfolio?x=1", why: "query string" },
  { value: "portfolio#frag", why: "fragment" },
  { value: "portfolio.jpg", why: "titik ekstensi" },
  { value: ".", why: "titik tunggal" },
  { value: "a".repeat(81), why: "81 karakter" },
  { value: "a".repeat(100), why: "100 karakter" },
  { value: "a".repeat(101), why: "101 karakter" },
  { value: "a".repeat(5000), why: "jauh melewati batas" },
];

describe("isValidSlug — menolak masukan berbahaya", () => {
  for (const { value, why } of HOSTILE_SLUGS) {
    test(`menolak ${why}`, () => {
      assert.equal(
        isValidSlug(value),
        false,
        `${JSON.stringify(value.slice(0, 40))} (${why}) seharusnya ditolak`,
      );
    });
  }
});

describe("isValidSlug — menerima slug normal", () => {
  test("menerima portfolio-dashboard", () => {
    assert.equal(isValidSlug("portfolio-dashboard"), true);
  });

  test("menerima bentuk sah lain", () => {
    for (const ok of ["a", "a1", "project-2025", "retro-game-arcade-hub", "x".repeat(80)]) {
      assert.equal(isValidSlug(ok), true, `${ok} seharusnya diterima`);
    }
  });

  test("batas panjang: 80 diterima, 81 ditolak", () => {
    assert.equal(isValidSlug("a".repeat(80)), true);
    assert.equal(isValidSlug("a".repeat(81)), false);
  });
});

describe("slugify — idempoten", () => {
  test("slugify(slugify(x)) === slugify(x) untuk masukan normal", () => {
    const samples = [
      "Portfolio Dashboard",
      "Retro Game: Arcade & Hub!",
      "Café Résumé",
      "Aplikasi Kasir (v2.0)",
      "  spasi   banyak  ",
      "UPPERCASE TITLE",
      "---halo---",
      "日本語",
      "!!!",
      "",
      "a-b-c",
      "project-2025",
      "a".repeat(200),
      "My Project!",
      "portfolio/dashboard",
      "../../etc/passwd",
      "%2e%2e%2fsecret",
      "portfolio<script>alert(1)</script>",
    ];
    for (const raw of samples) {
      const once = slugify(raw);
      const twice = slugify(once);
      assert.equal(
        twice,
        once,
        `slugify tidak idempoten untuk ${JSON.stringify(raw.slice(0, 30))}: ${JSON.stringify(once)} -> ${JSON.stringify(twice)}`,
      );
    }
  });

  test("hasil slugify selalu aman dipakai ulang sebagai slug", () => {
    for (const raw of ["Portfolio Dashboard", "Café", "日本語", "a".repeat(200), "!!!"]) {
      const slug = slugify(raw);
      assert.ok(
        slug === "" || isValidSlug(slug),
        `slugify(${JSON.stringify(raw.slice(0, 20))}) -> ${JSON.stringify(slug)} tidak valid`,
      );
    }
  });
});

describe("normalizeSlug — gerbang input dari klien", () => {
  test("masukan non-string ditolak", () => {
    for (const bad of [undefined, null, 123, 0, true, {}, [], ["a"], Symbol("x")]) {
      assert.equal(normalizeSlug(bad), null, `${String(bad)} seharusnya null`);
    }
  });

  test("string kosong atau hanya spasi ditolak", () => {
    for (const bad of ["", " ", "   ", "\t", "\n", "  \n "]) {
      assert.equal(normalizeSlug(bad), null, `${JSON.stringify(bad)} seharusnya null`);
    }
  });

  test("masukan yang tidak menyisakan karakter aman ditolak", () => {
    for (const bad of ["!!!", "...", "日本語", "///", "&", "?"]) {
      assert.equal(normalizeSlug(bad), null, `${JSON.stringify(bad)} seharusnya null`);
    }
  });

  test("escape ter-encode dinetralkan, tidak lolos sebagai traversal", () => {
    for (const raw of ["%2e", "%2e%2e", "%2e%2e%2f", "%2f", "%00", "%252e%252e"]) {
      const slug = normalizeSlug(raw);
      assert.ok(
        slug === null || !/[%/.]/.test(slug),
        `normalizeSlug(${JSON.stringify(raw)}) -> ${JSON.stringify(slug)} masih menyimpan % atau .`,
      );
      assert.ok(
        slug === null || !slug.includes("/"),
        `normalizeSlug(${JSON.stringify(raw)}) -> ${JSON.stringify(slug)} masih mengandung /`,
      );
    }
  });

  test("judul manusiawi dinormalisasi jadi slug", () => {
    assert.equal(normalizeSlug("My Project!"), "my-project");
    assert.equal(normalizeSlug("  Portfolio  Dashboard  "), "portfolio-dashboard");
    assert.equal(normalizeSlug("Café Résumé"), "cafe-resume");
  });

  test("slug yang sudah bersih tidak diubah", () => {
    assert.equal(normalizeSlug("portfolio-dashboard"), "portfolio-dashboard");
  });

  test("selalu mengembalikan slug valid atau null, tidak pernah slug cacat", () => {
    const raw = [
      ...HOSTILE_SLUGS.map((entry) => entry.value),
      "My Project!",
      "a".repeat(79) + " b",
      "a".repeat(80),
      "a".repeat(81),
      "a".repeat(79) + "-b",
      "  Portfolio  ",
      "Café",
    ];
    for (const value of raw) {
      const slug = normalizeSlug(value);
      assert.ok(
        slug === null || isValidSlug(slug),
        `normalizeSlug(${JSON.stringify(value.slice(0, 30))}) -> ${JSON.stringify(slug)} bukan slug valid`,
      );
    }
  });

  test("konsisten dengan slugify + isValidSlug", () => {
    for (const value of ["My Project!", "portfolio-dashboard", "!!!", "a".repeat(200), "日本語"]) {
      const slug = slugify(value.trim());
      const expected = isValidSlug(slug) ? slug : null;
      assert.equal(normalizeSlug(value), expected);
    }
  });
});
