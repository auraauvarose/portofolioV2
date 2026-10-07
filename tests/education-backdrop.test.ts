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

  test(".edu-rail-fill memakai accent", () => {
    const body = ruleBody(".edu-rail-fill");
    assert.ok(body, "rule .edu-rail-fill hilang");
    assert.match(body, /var\(--color-accent\)/, "fill garis kehilangan accent");
  });

  test(".edu-node.is-done memakai accent", () => {
    const body = ruleBody(".edu-node.is-done");
    assert.ok(body, "rule .edu-node.is-done hilang");
    assert.match(body, /var\(--color-accent\)/, "node selesai kehilangan accent");
  });

  test(".edu-index-mark masih ada", () => {
    assert.ok(ruleBody(".edu-index-mark"), "rule .edu-index-mark hilang");
  });

  test(".edu-period.is-current memakai accent", () => {
    const body = ruleBody(".edu-period.is-current");
    assert.ok(body, "rule .edu-period.is-current hilang");
    assert.match(body, /var\(--color-accent\)/, "periode berjalan kehilangan accent");
  });
});

describe("Education tidak lagi memakai wadah kartu", () => {
  const removed = [
    ".edu-panel",
    ".edu-chip",
    ".edu-pulse",
    ".edu-ghost",
    ".edu-ghost-wrap",
    ".edu-body",
    ".edu-stack",
  ];

  for (const sel of removed) {
    test(`rule ${sel} sudah dihapus`, () => {
      assert.equal(
        ruleBody(sel),
        null,
        `${sel} masih ada — wadah kartu belum dibersihkan`,
      );
    });
  }

  test("markup Education tidak merender wadah kartu itu", () => {
    for (const cls of ["edu-panel", "edu-chip", "edu-pulse", "edu-ghost"]) {
      assert.doesNotMatch(
        EDU,
        new RegExp(cls),
        `${cls} masih dirender di Education.tsx`,
      );
    }
  });

  test("node adalah satu elemen, bukan pembungkus dengan anak", () => {
    assert.equal(
      ruleBody(".edu-node > span"),
      null,
      "node masih memakai struktur pembungkus > span",
    );
    assert.match(
      EDU,
      /className=\{`edu-node/,
      "node tidak lagi dirender langsung sebagai elemen tunggal",
    );
  });
});
