import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { slugify, isValidSlug } from "../src/lib/slug.ts";

// ============================================================================
// Slug dipakai untuk URL /work/<slug>. Nilai ini sampai ke database dan ke
// route publik, jadi dua hal harus dijamin:
//   1. slugify menghasilkan slug yang selalu valid,
//   2. isValidSlug menolak apa pun yang bisa keluar dari pola route.
// ============================================================================

describe("slugify", () => {
  test("judul biasa jadi huruf kecil bertanda hubung", () => {
    assert.equal(slugify("Portfolio Dashboard"), "portfolio-dashboard");
  });

  test("tanda baca dan simbol dibuang", () => {
    assert.equal(slugify("Retro Game: Arcade & Hub!"), "retro-game-arcade-hub");
  });

  test("diakritik dinormalisasi, bukan dibuang mentah", () => {
    assert.equal(slugify("Café Résumé"), "cafe-resume");
  });

  test("spasi berlebih tidak menghasilkan hubung ganda", () => {
    assert.equal(slugify("  a    b  "), "a-b");
  });

  test("hubung di ujung dibuang", () => {
    assert.equal(slugify("---halo---"), "halo");
  });

  test("teks non-latin habis karakter -> string kosong", () => {
    // Tidak ada alfanumerik yang tersisa; pemanggil harus menanganinya.
    assert.equal(slugify("日本語"), "");
  });

  test("dipotong di 80 karakter", () => {
    assert.ok(slugify("a".repeat(200)).length <= 80);
  });

  test("slugify tidak pernah menghasilkan hubung ganda atau di ujung", () => {
    const samples = ["a - b", "A--B", "x & - y", "test - - test", "---x---"];
    for (const s of samples) {
      const slug = slugify(s);
      assert.ok(!slug.includes("--"), `${JSON.stringify(s)} -> ${slug} ada hubung ganda`);
      assert.ok(!slug.startsWith("-"), `${JSON.stringify(s)} -> ${slug} mulai hubung`);
      assert.ok(!slug.endsWith("-"), `${JSON.stringify(s)} -> ${slug} akhir hubung`);
    }
  });

  test("hasil slugify selalu lolos isValidSlug", () => {
    const samples = [
      "Portfolio Dashboard",
      "Retro Game: Arcade & Hub!",
      "Café Résumé",
      "Aplikasi Kasir (v2.0)",
      "  spasi   banyak  ",
      "UPPERCASE TITLE",
    ];
    for (const s of samples) {
      const slug = slugify(s);
      assert.ok(
        slug === "" || isValidSlug(slug),
        `slugify(${JSON.stringify(s)}) -> ${JSON.stringify(slug)} tidak valid`,
      );
    }
  });
});

describe("isValidSlug", () => {
  test("menerima slug normal", () => {
    assert.ok(isValidSlug("portfolio-dashboard"));
    assert.ok(isValidSlug("a"));
    assert.ok(isValidSlug("project-2025"));
  });

  test("menolak path traversal", () => {
    assert.ok(!isValidSlug(".."));
    assert.ok(!isValidSlug("../../etc/passwd"));
    assert.ok(!isValidSlug("a/../b"));
  });

  test("menolak garis miring dan titik", () => {
    assert.ok(!isValidSlug("a/b"));
    assert.ok(!isValidSlug("a.b"));
    assert.ok(!isValidSlug("."));
  });

  test("menolak huruf besar dan karakter aneh", () => {
    assert.ok(!isValidSlug("Portfolio"));
    assert.ok(!isValidSlug("portofolio dashboard"));
    assert.ok(!isValidSlug("portofolio<script>"));
    assert.ok(!isValidSlug("portofolio%20x"));
  });

  test("menolak hubung di ujung", () => {
    assert.ok(!isValidSlug("-abc"));
    assert.ok(!isValidSlug("abc-"));
  });

  test("menolak hubung ganda (slugify selalu menciutkannya)", () => {
    // slugify() menciutkan deretan non-alfanumerik jadi SATU hubung, jadi
    // hubung ganda tidak pernah dihasilkan dan sengaja ditolak di sini.
    assert.ok(!isValidSlug("a--b"));
  });

  test("menolak string kosong dan yang terlalu panjang", () => {
    assert.ok(!isValidSlug(""));
    assert.ok(!isValidSlug("a".repeat(81)));
  });
});
