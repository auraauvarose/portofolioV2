import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { THEME_CHOICES, isTheme, readStoredTheme } from "../src/lib/theme.ts";

// ============================================================================
// Menu kontrol halaman /komentar — pilihan tema + musik.
//
// Permintaan user: "bagian halaman komentar sediakan menu untuk pilihan thema,
// music kalau mode desktop buat di atas aja center kalau di mobile sama kan aja."
//
// Kontrak yang dikunci di sini:
//   1. Menu menawarkan KEDUA tema secara eksplisit (bukan cuma tombol toggle),
//      sehingga pilihan tema adalah keputusan user, bukan tebakan.
//   2. Menu juga menyediakan kontrol musik.
//   3. Penempatan: fixed di atas, center — dan identik di mobile (tanpa
//      cabang md:/hidden yang memindahkan atau menyembunyikannya).
//
// Logika murni (src/lib/theme.ts) diuji langsung; wiring komponen diperiksa
// dari sumbernya, mengikuti pola tests/education-spine.test.ts.
// ============================================================================

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const src = (p: string) => readFileSync(resolve(root, p), "utf8");

describe("theme — dua pilihan tema yang sah", () => {
  test("daftar tema berisi tepat dark dan light", () => {
    assert.deepEqual([...THEME_CHOICES].sort(), ["dark", "light"]);
  });

  test("isTheme hanya menerima nilai tema yang sah, peka huruf besar-kecil", () => {
    assert.equal(isTheme("dark"), true);
    assert.equal(isTheme("light"), true);
    assert.equal(isTheme("Dark"), false);
    assert.equal(isTheme(null), false);
    assert.equal(isTheme(undefined), false);
    assert.equal(isTheme(""), false);
  });

  test("nilai tersimpan yang rusak jatuh ke dark, bukan tema acak", () => {
    assert.equal(readStoredTheme("light"), "light");
    assert.equal(readStoredTheme("dark"), "dark");
    assert.equal(readStoredTheme(null), "dark");
    assert.equal(readStoredTheme("sepia"), "dark");
    assert.equal(readStoredTheme(""), "dark");
  });
});

describe("label menu — bilingual en/id", () => {
  const CONFIG = src("src/lib/config.ts");

  test("config mengekspor blok pageControls", () => {
    assert.match(CONFIG, /export const pageControls\s*=/);
  });

  for (const key of [
    "themeDark",
    "themeLight",
    "musicLabel",
    "playMusic",
    "pauseMusic",
  ]) {
    test(`${key} punya label en dan id yang tidak kosong`, () => {
      const m = CONFIG.match(
        new RegExp(`${key}:\\s*\\{\\s*en:\\s*"([^"]*)",\\s*id:\\s*"([^"]*)"\\s*\\}`),
      );
      assert.ok(m, `label ${key} harus berbentuk { en, id }`);
      assert.ok(m![1].length > 0, `label ${key} versi en kosong`);
      assert.ok(m![2].length > 0, `label ${key} versi id kosong`);
    });
  }
});

describe("PageControls — penempatan di atas, center, sama di mobile", () => {
  const FILE = "src/components/PageControls.tsx";

  test("komponen ada", () => {
    assert.ok(existsSync(resolve(root, FILE)), `${FILE} belum dibuat`);
  });

  const PC = src(FILE);

  test("memilih tema secara eksplisit lewat setTheme, bukan sekadar toggle", () => {
    assert.match(PC, /useLanguage\(\)/);
    assert.match(PC, /setTheme\(/);
    assert.ok(
      !/toggleTheme/.test(PC),
      "menu pilihan tema tidak boleh bergantung pada toggle buta",
    );
  });

  test("menawarkan kedua tema dari konfigurasi", () => {
    assert.match(PC, /themeDark/);
    assert.match(PC, /themeLight/);
    assert.match(PC, /THEME_CHOICES/);
  });

  test("menyediakan kontrol musik", () => {
    assert.match(PC, /MusicPlayer/);
    assert.match(PC, /variant="bar"/);
  });

  test("bar fixed di atas dan di-center tanpa cabang responsif", () => {
    const bar =
      PC.split("\n").find((l) => l.includes("fixed inset-x-0")) ?? "";
    assert.ok(bar.length > 0, "bar harus fixed dengan inset-x-0");
    assert.match(bar, /justify-center/, "bar harus di-center");
    assert.match(bar, /top-\d/, "bar harus menempel di atas");
    assert.ok(
      !/\bmd:/.test(bar),
      "penempatan mobile harus sama dengan desktop (tanpa cabang md:)",
    );
    assert.ok(
      !/\bhidden\b/.test(bar),
      "bar tidak boleh disembunyikan di mobile",
    );
  });
});

describe("wiring halaman komentar", () => {
  test("CommentsClient memasang PageControls", () => {
    const CC = src("src/components/CommentsClient.tsx");
    assert.match(CC, /import PageControls from "@\/components\/PageControls"/);
    assert.match(CC, /<PageControls\s*\/>/);
  });

  test("MusicPlayer punya varian bar yang dipakai menu", () => {
    const MP = src("src/components/MusicPlayer.tsx");
    assert.match(MP, /"rail"\s*\|\s*"menu"\s*\|\s*"bar"/);
    assert.match(MP, /variant === "bar"/);
  });

  test("provider mengekspos setTheme dan memakai kontrak tema bersama", () => {
    const P = src("src/components/providers.tsx");
    assert.match(P, /from "@\/lib\/theme"/);
    assert.match(P, /setTheme,/);
  });
});
