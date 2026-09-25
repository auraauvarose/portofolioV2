import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// ============================================================================
// Headline hero "FULLSTACK / DEVELOPER" wajib PUTIH di KEDUA mode.
//
// Permintaan user: di dark mode "dibuat lebih putih", lalu "saat mode
// terang/light ... jadikan putih jangan gelap".
//
// Jebakan yang dikunci di sini — globals.css punya rule catch-all:
//
//     :root:not(.dark) [class*="text-white/"] { color: #1c1c1e; }
//
// Selector itu mencocokkan ATRIBUT class sebagai substring, bukan utility
// yang benar-benar aktif. Jadi menuliskan varian `dark:text-white/90` di
// elemen ini — walau varian `dark:` tidak pernah menyala di light mode —
// tetap membuat atribut class mengandung "text-white/" sehingga rule di atas
// menang (spesifisitas 0,3,0 mengalahkan 0,1,0) dan headline dipaksa jadi
// near-black #1c1c1e di light mode. Itu regresi nyata: teks gelap di atas
// artwork hero yang gelap, praktis tak terbaca.
//
// Karena itu warna headline WAJIB ditulis dalam bentuk bracket
// (`text-[#ffffff]/NN`) yang TIDAK mengandung substring "text-white/" dan
// dengan demikian lolos dari catch-all.
//
// Bukti terukur (Chrome headless, light mode):
//   sebelum perbaikan -> h1 computed rgb(28, 28, 30)
//   sesudah perbaikan -> h1 computed putih
// ============================================================================

const here = dirname(fileURLToPath(import.meta.url));
const HERO = readFileSync(resolve(here, "../src/components/Hero.tsx"), "utf8");
const CSS = readFileSync(resolve(here, "../src/app/globals.css"), "utf8");

/** Selector catch-all yang membajak elemen ber-class mengandung "text-white/". */
const HIJACK_SELECTOR = ':root:not(.dark) [class*="text-white/"]';

/** Ambil atribut className dari elemen headline hero. */
function headlineClassName(): string {
  const m = HERO.match(/<h1 className="([^"]*hero-title-3d__heading[^"]*)"/);
  assert.ok(m, "h1.hero-title-3d__heading tidak ditemukan di Hero.tsx");
  return m![1];
}

describe("Headline hero — putih di light & dark, bebas dari catch-all", () => {
  test("atribut class headline tidak mengandung substring 'text-white/'", () => {
    const cls = headlineClassName();
    assert.ok(
      !cls.includes("text-white/"),
      `class headline mengandung "text-white/" sehingga dibajak oleh ${HIJACK_SELECTOR} di light mode: ${cls}`,
    );
  });

  test("warna light mode ditulis bracket-form dan bernilai putih", () => {
    const cls = headlineClassName();
    const light = cls.match(/(?:^|\s)text-\[#ffffff\]\/(\d+)/);
    assert.ok(
      light,
      "light mode wajib memakai text-[#ffffff]/NN (bracket-form) agar tidak kena catch-all",
    );
  });

  test("warna dark mode ditulis bracket-form dan bernilai putih", () => {
    const cls = headlineClassName();
    const dark = cls.match(/(?:^|\s)dark:text-\[#ffffff\]\/(\d+)/);
    assert.ok(
      dark,
      "dark mode wajib memakai dark:text-[#ffffff]/NN (bracket-form), bukan dark:text-white/NN",
    );
  });

  test("tidak ada utility text-white/ telanjang di seluruh headline", () => {
    const cls = headlineClassName();
    // Utility polos `text-white/NN` (tanpa bracket) itulah pemicu regresi.
    const bare = cls.match(/(?:^|\s)(?:dark:)?text-white\/\d+/g);
    assert.equal(
      bare,
      null,
      `ditemukan utility text-white/NN telanjang: ${bare?.join(", ")}`,
    );
  });

  test("catch-all masih ada di CSS — alasan kontrak ini dijaga", () => {
    const clean = CSS.replace(/\/\*[\s\S]*?\*\//g, "");
    const rules: { sel: string; body: string }[] = [];
    const re = /([^{}]+)\{([^{}]*)\}/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(clean))) {
      rules.push({ sel: m[1].replace(/\s+/g, " ").trim(), body: m[2] });
    }
    const hit = rules.find((r) => r.sel === HIJACK_SELECTOR);
    assert.ok(
      hit,
      `rule ${HIJACK_SELECTOR} hilang — kontrak ini perlu ditinjau ulang`,
    );
    assert.match(
      hit!.body,
      /#1c1c1e/,
      "catch-all diharapkan tetap memaksa #1c1c1e untuk elemen lain",
    );
  });
});
