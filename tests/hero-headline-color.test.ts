import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const HERO = readFileSync(resolve(here, "../src/components/Hero.tsx"), "utf8");
const CSS = readFileSync(resolve(here, "../src/app/globals.css"), "utf8");

const HIJACK_SELECTOR = ':root:not(.dark) [class*="text-white/"]';

function headlineClassName(): string {
  const m = HERO.match(/<h1 className="([^"]*hero-title-3d__heading[^"]*)"/);
  assert.ok(m, "h1.hero-title-3d__heading tidak ditemukan di Hero.tsx");
  return m![1];
}

function parseRules(css: string): { sel: string; body: string }[] {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const rules: { sel: string; body: string }[] = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(clean))) {
    rules.push({ sel: m[1].replace(/\s+/g, " ").trim(), body: m[2] });
  }
  return rules;
}

function strokeRgb(body: string): number[] | null {
  const m = body.match(/-webkit-text-stroke:[^;]*?rgb\(\s*(\d+)\s+(\d+)\s+(\d+)/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

describe("Headline hero — teks putih filled + garis hitam tipis", () => {
  test("atribut class headline tidak mengandung substring 'text-white/'", () => {
    const cls = headlineClassName();
    assert.ok(
      !cls.includes("text-white/"),
      `class headline mengandung "text-white/" sehingga dibajak oleh ${HIJACK_SELECTOR} di light mode: ${cls}`,
    );
  });

  test("warna teks tetap bracket-form putih di kedua mode", () => {
    const cls = headlineClassName();
    const light = cls.match(/(?:^|\s)text-\[#ffffff\]\/(\d+)/);
    const dark = cls.match(/(?:^|\s)dark:text-\[#ffffff\]\/(\d+)/);
    assert.ok(light, "warna teks harus text-[#ffffff]/NN (bracket-form) agar tidak kena catch-all");
    assert.ok(dark, "warna teks harus dark:text-[#ffffff]/NN (bracket-form)");
    assert.equal(
      light![1],
      dark![1],
      "light dan dark wajib filled putih dengan opacity sama",
    );
  });

  test("heading tetap filled — garis ditambah, bukan mengganti isi", () => {
    const rule = parseRules(CSS).find((r) => r.sel === ".hero-title-3d__heading");
    assert.ok(rule, "rule .hero-title-3d__heading tidak ditemukan");
    assert.ok(
      !/color:\s*transparent/.test(rule!.body),
      "headline harus tetap filled; hanya_border yang ditambahkan",
    );
  });

  test("garis border hitam tipis ditambahkan pada heading", () => {
    const rule = parseRules(CSS).find((r) => r.sel === ".hero-title-3d__heading");
    assert.ok(rule, "rule .hero-title-3d__heading tidak ditemukan");
    assert.match(rule!.body, /-webkit-text-stroke:\s*1px/, "harus ada garis 1px");
    const rgb = strokeRgb(rule!.body);
    assert.ok(rgb, "warna garis tidak terbaca");
    assert.ok(rgb.every((c) => c < 64), `garis harus hitam, dapat ${rgb.join(",")}`);
  });

  test("layer depth tetap filled oranye — efek 3D asli tidak hilang", () => {
    const rule = parseRules(CSS).find((r) => r.sel === ".hero-title-3d__depth");
    assert.ok(rule, "rule .hero-title-3d__depth tidak ditemukan");
    assert.match(rule!.body, /color:\s*rgb\(235 89 57/, "layer depth harus oranye solid");
    assert.ok(
      !/color:\s*transparent/.test(rule!.body),
      "layer depth tidak boleh dihollow — menutupi outline depan",
    );
  });

  test("hover tidak memaksa warna gelap di light mode", () => {
    const hover = parseRules(CSS).filter(
      (r) => r.sel.includes(".hero-title-3d:hover") && r.body.includes("color:"),
    );
    for (const r of hover) {
      assert.match(
        r.body,
        /rgb\(255 255 255/,
        `hover di light mode memaksa warna non-putih: ${r.sel} { ${r.body} }`,
      );
    }
  });

  test("tidak ada utility text-white/ telanjang di seluruh headline", () => {
    const cls = headlineClassName();
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
