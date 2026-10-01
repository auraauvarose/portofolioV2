import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { deepShapeMatches } from "../src/lib/site-content-shape.ts";

describe("deepShapeMatches", () => {
  const aboutFallback = {
    kicker: "About",
    paragraphs: ["satu", "dua"],
  };

  test("menerima nilai yang bentuknya cocok", () => {
    assert.equal(
      deepShapeMatches(aboutFallback, {
        kicker: "Tentang",
        paragraphs: ["a"],
      }),
      null,
    );
  });

  test("menolak array yang dikirim sebagai objek (kasus brick homepage)", () => {
    const err = deepShapeMatches(aboutFallback, {
      kicker: "Tentang",
      paragraphs: {},
    });
    assert.equal(typeof err, "string");
  });

  test("menolak tipe primitif yang tertukar", () => {
    assert.notEqual(
      deepShapeMatches(aboutFallback, { kicker: 42, paragraphs: [] }),
      null,
    );
  });

  test("menolak elemen array yang bentuknya salah", () => {
    const techStackFallback = {
      categories: [{ title: { en: "Frontend", id: "Frontend" }, items: ["a"] }],
    };
    const err = deepShapeMatches(techStackFallback, {
      categories: [{}],
    });
    assert.equal(typeof err, "string");
  });

  test("menerima elemen array yang bentuknya benar", () => {
    const techStackFallback = {
      categories: [{ title: { en: "Frontend", id: "Frontend" }, items: ["a"] }],
    };
    assert.equal(
      deepShapeMatches(techStackFallback, {
        categories: [{ title: { en: "X", id: "Y" }, items: ["b", "c"] }],
      }),
      null,
    );
  });

  test("menolak objek bertingkat yang hilang", () => {
    const navFallback = { items: [{ label: { en: "Home", id: "Beranda" } }] };
    assert.notEqual(
      deepShapeMatches(navFallback, { items: [{ label: "Home" }] }),
      null,
    );
  });

  test("menerima array kosong bila fallback memang kosong", () => {
    assert.equal(deepShapeMatches({ items: [] }, { items: [] }), null);
  });

  test("menolak null pada cabang objek", () => {
    assert.notEqual(deepShapeMatches({ a: { b: "x" } }, { a: null }), null);
  });

  test("menerima nilai tambahan yang tidak ada di fallback", () => {
    assert.equal(
      deepShapeMatches({ a: "x" }, { a: "y", extra: { apa: "saja" } }),
      null,
    );
  });

  test("menolak panjang teks yang keterlaluan", () => {
    assert.notEqual(
      deepShapeMatches({ a: "x" }, { a: "x".repeat(50_001) }),
      null,
    );
  });
});
