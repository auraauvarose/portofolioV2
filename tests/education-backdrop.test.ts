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
  const pattern = /([^{}]+)\{([^{}]*)\}/g;
  for (const hit of clean.matchAll(pattern)) {
    out.push({ sel: hit[1].replace(/\s+/g, " ").trim(), body: hit[2] });
  }
  return out;
}

const RULES = parseRules(CSS);

function ruleBody(selector: string): string | null {
  const hits = RULES.filter((r) => r.sel === selector);
  return hits.length ? hits[hits.length - 1].body : null;
}

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
  test(".edu-detail memakai accent", () => {
    const body = ruleBody(".edu-detail");
    assert.ok(body, "rule .edu-detail hilang");
    assert.match(body, /var\(--color-accent\)/, ".edu-detail kehilangan accent");
  });

  test(".edu-band-rule memakai accent saat pitanya aktif", () => {
    const body = ruleBody(".edu-band.is-active > .edu-band-rule");
    assert.ok(body, "rule .edu-band.is-active > .edu-band-rule hilang");
    assert.match(
      body,
      /rgba\(235,\s*89,\s*57/,
      "garis pita aktif kehilangan accent",
    );
  });

  test(".edu-period.is-current memakai accent", () => {
    const body = ruleBody(".edu-period.is-current");
    assert.ok(body, "rule .edu-period.is-current hilang");
    assert.match(body, /var\(--color-accent\)/, "periode berjalan kehilangan accent");
  });

  test(".edu-band-ghost memakai accent saat pitanya aktif", () => {
    const body = ruleBody(".edu-band.is-active .edu-band-ghost");
    assert.ok(body, "rule .edu-band.is-active .edu-band-ghost hilang");
    assert.match(
      body,
      /rgba\(235,\s*89,\s*57/,
      "angka latar pita aktif kehilangan accent",
    );
  });
});

describe("Education tidak kembali ke wadah kartu bergaya template", () => {
  /* Wadah yang dulu pernah ada dan sengaja tidak dikembalikan: tiap-tiapnya
     menambah bingkai tanpa menambah informasi. Pita baru (.edu-band) dibangun
     dari nol dan tidak memakai satu pun kelas lama ini. */
  const removed = [
    ".edu-panel",
    ".edu-chip",
    ".edu-pulse",
    ".edu-ghost",
    ".edu-ghost-wrap",
    ".edu-body",
    ".edu-stack",
    ".edu-plate",
    ".edu-slab",
    ".edu-face",
    ".edu-slot",
    ".edu-rail",
    ".edu-node",
    ".edu-strip",
    ".edu-toc",
    ".edu-index-mark",
  ];

  for (const sel of removed) {
    test(`rule ${sel} sudah dihapus`, () => {
      assert.equal(
        ruleBody(sel),
        null,
        `${sel} masih ada — wadah/rel lama belum dibersihkan`,
      );
    });
  }

  test("markup Education tidak merender wadah kartu itu", () => {
    for (const cls of [
      "edu-panel",
      "edu-chip",
      "edu-pulse",
      "edu-ghost",
      "edu-plate",
      "edu-slab",
      "edu-rail",
      "edu-node",
    ]) {
      assert.doesNotMatch(
        EDU,
        new RegExp(cls),
        `${cls} masih dirender di Education.tsx`,
      );
    }
  });
});
