import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const CSS = readFileSync(resolve(here, "../src/app/globals.css"), "utf8");
const EDU = readFileSync(resolve(here, "../src/components/Education.tsx"), "utf8");

function parseRules(css: string): { sel: string; body: string }[] {
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

function ruleBody(selector: string): string | null {
  const hits = RULES.filter((r) => r.sel === selector);
  return hits.length ? hits[hits.length - 1].body : null;
}

type Rgba = { r: number; g: number; b: number; a: number };

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
    const body = ruleBody(".edu-panel");
    assert.ok(body, "rule .edu-panel hilang");
    assert.ok(
      colors(body).some(isOrange),
      "wash orange di permukaan kartu terhapus — di luar scope yang disetujui",
    );
  });
});
