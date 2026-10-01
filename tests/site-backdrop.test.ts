import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const src = (p: string) => readFileSync(resolve(here, "..", p), "utf8");

const CSS = src("src/app/globals.css");
const SMOOTH = src("src/components/SmoothScroll.tsx");

const stripComments = (code: string) =>
  code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

const CSS_CODE = stripComments(CSS);
const SMOOTH_CODE = stripComments(SMOOTH);

/* Body rule kedua ikut digabung agar slicing tidak Awakening. */
function bodyRules(): string {
  const out: string[] = [];
  const re = /(?:^|[}\n])\s*body\s*(?:,[^{]*)?\{([^}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(CSS_CODE))) out.push(m[1]);
  return out.join("\n");
}

describe("A. titik-titik di background seluruh situs", () => {
  test("body memakai radial-gradient titik", () => {
    const body = bodyRules();
    assert.ok(body.length, "aturan body tidak ditemukan");
    // Pakai rentang welded: isinya memuat var(--site-dot) yang punya kurung
    // sendiri, jadi [^)] akan terpotong di tengah.
    assert.match(
      body,
      /radial-gradient\([\s\S]{0,80}?1px[\s\S]{0,80}?\)/,
      `body harus punya pola titik radial: ${body}`,
    );
  });

  test("ukuran pola mengikuti TechStack (26px)", () => {
    assert.match(
      bodyRules(),
      /background-size:\s*26px\s+26px/,
      "pola titik harus 26px agar sama dengan section TechStack",
    );
  });

  test("warna titik default adalah abu-abu netral, bukan orange", () => {
    // initial-value berada beberapa baris setelah nama property, jadi harus
    // melintasi baris baru — [^;] akan mentok di syntax: "<color>";
    assert.match(
      CSS_CODE,
      /@property\s+--site-dot\s*\{[\s\S]{0,200}?initial-value:\s*rgba\(127,\s*127,\s*127/,
      "titik default harus netral; orange hanya saat sudah scroll",
    );
  });
});

describe("B. custom property didaftarkan agar bisa di-transition", () => {
  test("@property --site-dot terdaftar dengan syntax <color>", () => {
    assert.match(CSS_CODE, /@property\s+--site-dot/, "butuh @property");
    const block = CSS_CODE.match(/@property\s+--site-dot\s*\{[^}]*\}/)?.[0] ?? "";
    assert.match(block, /syntax:\s*"<color>"/);
    assert.match(block, /inherits:\s*true/);
  });

  test("warna titik TIDAK di-transition (cegah repaint seluruh halaman)", () => {
    // --site-dot dipakai di background-image body, dan body dicat setinggi
    // seluruh dokumen. Mentransisikannya berarti tiap frame selama durasi
    // transisi memicu repaint gradien sepanjang dokumen, jadi scroll patah
    // di awal. Perpindahan abu -> orange harus instan.
    const animated =
      CSS_CODE.match(
        /transition:\s*[^;}]*--(?:site-dot|sc-node)[^;}]*/g,
      ) ?? [];
    assert.equal(
      animated.length,
      0,
      `custom property latar tidak boleh di-transition: ${animated.join(" | ")}`,
    );
  });
});

describe("C. jadi orange saat scroll", () => {
  test("ada state .is-scrolled dengan warna accent", () => {
    const rule =
      CSS_CODE.match(/html\.is-scrolled\s*(?:,[^{]*)?\{([^}]*)\}/)?.[1] ?? "";
    assert.ok(rule, "aturan html.is-scrolled tidak ditemukan");
    assert.match(
      rule,
      /--site-dot:\s*rgba\(235,\s*89,\s*57/,
      `state scroll harus memakai rgb(235,89,57) = --color-accent: ${rule}`,
    );
  });

  test("scroll listener memakai listener pasif", () => {
    assert.match(
      SMOOTH_CODE,
      /addEventListener\(\s*"scroll"[\s\S]{0,120}?passive:\s*true/,
      "scroll listener harus passive agar tidak memblokir scroll",
    );
  });

  test("listener dipasang DAN dilepas (tidak leak)", () => {
    assert.match(SMOOTH_CODE, /removeEventListener\(\s*"scroll"/);
  });

  test("state dibersihkan saat unmount", () => {
    assert.match(
      SMOOTH_CODE,
      /classList\.remove\("is-scrolled"\)/,
      "class global harus dibersihkan saat komponen unmount",
    );
  });

  test("effect scroll terpisah dari Lenis (tetap jalan di touch)", () => {
    const effects = SMOOTH_CODE.match(/useEffect\(/g) ?? [];
    assert.ok(
      effects.length >= 2,
      "butuh useEffect terpisah; kalau menyatu, effect Lenis di-skip di touch lalu tidak ada dot oranye",
    );
  });
});

describe("D. tidak merusak sistem yang ada", () => {
  test("background-color body tetap var(--color-ink)", () => {
    assert.match(
      bodyRules(),
      /background-color:\s*var\(--color-ink\)/,
      "warna dasar body jangan hilang",
    );
  });

  test("tidak ada scroll listener duplikat dari util lama di file ini", () => {
    assert.doesNotMatch(
      SMOOTH_CODE,
      /getScrollDirection/,
      "pakai listener sendiri, jangan campur util direction",
    );
  });
});
