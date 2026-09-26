import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";

import { keyFromPublicUrl } from "../src/lib/r2-cleanup.ts";

const ORIGINAL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

before(() => {
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL = "https://cdn.example.com";
});

after(() => {
  if (ORIGINAL === undefined) delete process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  else process.env.NEXT_PUBLIC_R2_PUBLIC_URL = ORIGINAL;
});

describe("keyFromPublicUrl", () => {
  test("URL sah menghasilkan key", () => {
    assert.equal(
      keyFromPublicUrl("https://cdn.example.com/projects/123-foto.jpg"),
      "projects/123-foto.jpg",
    );
  });

  test("query dan hash dibuang", () => {
    assert.equal(
      keyFromPublicUrl("https://cdn.example.com/a/b.jpg?x=1"),
      "a/b.jpg",
    );
    assert.equal(
      keyFromPublicUrl("https://cdn.example.com/a/b.jpg#frag"),
      "a/b.jpg",
    );
  });

  test("karakter ter-encode di-decode", () => {
    assert.equal(
      keyFromPublicUrl("https://cdn.example.com/foto%20spasi.jpg"),
      "foto spasi.jpg",
    );
  });

  test("domain lain ditolak", () => {
    assert.equal(keyFromPublicUrl("https://evil.example.com/foto.jpg"), null);
    assert.equal(keyFromPublicUrl("https://example.com/foto.jpg"), null);
  });

  test("domain yang menyerupai base ditolak", () => {
    assert.equal(
      keyFromPublicUrl("https://cdn.example.com.evil.com/foto.jpg"),
      null,
    );
    assert.equal(keyFromPublicUrl("https://cdn.example.com@evil.com/x.jpg"), null);
  });

  test("path traversal ditolak", () => {
    assert.equal(keyFromPublicUrl("https://cdn.example.com/../secret"), null);
    assert.equal(
      keyFromPublicUrl("https://cdn.example.com/projects/../../etc/passwd"),
      null,
    );
    assert.equal(keyFromPublicUrl("https://cdn.example.com/a/..%2Fb"), null);
  });

  test("key kosong ditolak", () => {
    assert.equal(keyFromPublicUrl("https://cdn.example.com/"), null);
  });

  test("nilai kosong/null/undefined aman", () => {
    assert.equal(keyFromPublicUrl(""), null);
    assert.equal(keyFromPublicUrl(null), null);
    assert.equal(keyFromPublicUrl(undefined), null);
  });

  test("string yang bukan URL ditolak", () => {
    assert.equal(keyFromPublicUrl("not-a-url"), null);
    assert.equal(keyFromPublicUrl("/projects/local.jpg"), null);
  });

  test("tanpa konfigurasi base, tidak ada yang dihapus", () => {
    const saved = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
    delete process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
    try {
      assert.equal(
        keyFromPublicUrl("https://cdn.example.com/projects/a.jpg"),
        null,
        "tanpa base, fungsi harus menolak (fail-closed)",
      );
    } finally {
      process.env.NEXT_PUBLIC_R2_PUBLIC_URL = saved;
    }
  });
});
