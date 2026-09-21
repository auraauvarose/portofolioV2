import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// ============================================================================
// Backdrop Education harus BERSIH — lapisan aura dihapus, bukan diabu-abukan.
//
// Riwayat: `.edu-aura` dulu lapisan radial-gradient seluas section (1440x823)
// berwarna terracotta, sehingga seluruh latar Education kebasahan orange.
// Percobaan pertama menggantinya dengan gradient netral (putih/hitam tipis),
// tapi itu masih meninggalkan kabut abu-abu di backdrop. Permintaan akhir:
// hapus saja lapisannya — backdrop polos, tanpa kabut.
//
// Yang dikunci di sini:
//   1. tidak ada lagi rule .edu-aura di CSS (dark maupun light),
//   2. tidak ada lagi elemen ber-class edu-aura di markup Education,
//   3. aksen foreground yang MEMANG orange tetap utuh,
//   4. wash di permukaan kartu (.edu-panel) tetap dibiarkan (di luar scope).
// ============================================================================

const here = dirname(fileURLToPath(import.meta.url));
const CSS = readFileSync(resolve(here, "../src/app/globals.css"), "utf8");
const EDU = readFileSync(resolve(here, "../src/components/Education.tsx"), "utf8");

/** Pecah CSS jadi daftar rule datar { sel, body }. */
function parseRules(css: string): { sel: string; body: string }[] {
  // Komentar dibuang lebih dulu: isinya bebas dan tanpa ini teks komentar
  // ikut menempel ke selector sehingga pencarian rule jadi meleset.
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const out: { sel: string; body: string }[] = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(clean))) {
    out.push({
      sel: m[1].replace(/\s+/g, " ").trim(),
      body: m[2],
    });
  }
  return out;
}

const RULES = parseRules(CSS);

/** Body deklarasi untuk selector persis. */
function ruleBody(selector: string): string | null {
  const hits = RULES.filter((r) => r.sel === selector);
  return hits.length ? hits[hits.length - 1].body : null;
}

type Rgba = { r: number; g: number; b: number; a: number };

/** Semua warna rgba/rgb di dalam sebuah body deklarasi. */
function colors(body: string): Rgba[] {
  const out: Rgba[] = [];
  const re = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    out.push({
      r: Number(m[1]),
      g: Number(m[2]),
      b: Number(m[3]),
      a: m[4] === undefined ? 1 : Number(m[4]),
    });
  }
  return out;
}

/** Cukup merah-dominan untuk terbaca sebagai orange/terracotta. */
const isOrange = (c: Rgba) => c.a > 0.02 && c.r > c.g + 30 && c.r > c.b + 40;

describe("lapisan backdrop Education (.edu-aura) sudah DIHAPUS", () => {
  test("tidak ada rule .edu-aura lagi di globals.css", () => {
    assert.equal(
      ruleBody(".edu-aura"),
      null,
      "rule .edu-aura masih ada — lapisan backdrop belum dihapus",
    );
  });

  test("tidak ada rule light-theme .edu-aura lagi", () => {
    assert.equal(
      ruleBody(":root:not(.dark) .edu-aura"),
      null,
      "varian light .edu-aura masih ada",
    );
  });

  test("tidak ada selector apa pun yang menyebut .edu-aura", () => {
    const hits = RULES.filter((r) => r.sel.includes("edu-aura"));
    assert.deepEqual(
      hits.map((h) => h.sel),
      [],
      "masih ada selector .edu-aura tersisa",
    );
  });

  test("tidak ada elemen .edu-aura di markup Education", () => {
    assert.doesNotMatch(
      EDU,
      /edu-aura/,
      "elemen .edu-aura masih dirender di Education.tsx",
    );
  });
});

describe("aksen foreground Education tetap terracotta", () => {
  // Batasan keras: yang dihapus hanya lapisan backdrop, bukan aksennya.
  test(".edu-chip masih pakai accent", () => {
    const body = ruleBody(".edu-chip");
    assert.ok(body, "rule .edu-chip hilang");
    const hasOrange = colors(body).some(isOrange);
    const usesToken = /var\(--color-accent\)/.test(body);
    assert.ok(hasOrange || usesToken, ".edu-chip kehilangan warna accent-nya");
  });

  test(".edu-pulse masih pakai accent", () => {
    const body = ruleBody(".edu-pulse");
    assert.ok(body, "rule .edu-pulse hilang");
    assert.match(body, /var\(--color-accent\)/, ".edu-pulse kehilangan accent");
  });

  test(".edu-node.is-done masih pakai accent", () => {
    const body = ruleBody(".edu-node.is-done > span");
    assert.ok(body, "rule .edu-node.is-done > span hilang");
    assert.match(body, /var\(--color-accent\)/, "node selesai kehilangan accent");
  });

  test(".edu-index-mark masih ada", () => {
    assert.ok(ruleBody(".edu-index-mark"), "rule .edu-index-mark hilang");
  });

  test("wash di permukaan kartu (.edu-panel) sengaja DIBIARKAN", () => {
    // User memilih "cukup backdrop section saja" — kalau test ini gagal karena
    // panel jadi netral, itu perubahan di luar scope.
    const body = ruleBody(".edu-panel");
    assert.ok(body, "rule .edu-panel hilang");
    assert.ok(
      colors(body).some(isOrange),
      "wash orange di permukaan kartu terhapus — di luar scope yang disetujui",
    );
  });
});
