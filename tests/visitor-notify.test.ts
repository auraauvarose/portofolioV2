import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { shouldNotify, visitMessage } from "../src/lib/visitor-notify.ts";

describe("shouldNotify", () => {
  test("IP baru → true", () => {
    assert.equal(shouldNotify("10.0.0.1", 2_000_000_000_000), true);
  });

  test("IP sama dalam 6 jam → false", () => {
    const now = 2_000_000_000_000;
    assert.equal(shouldNotify("10.0.0.2", now), true);
    assert.equal(shouldNotify("10.0.0.2", now + 60_000), false);
  });

  test("IP sama setelah 6 jam → true lagi", () => {
    const now = 2_000_000_000_000;
    assert.equal(shouldNotify("10.0.0.3", now), true);
    assert.equal(shouldNotify("10.0.0.3", now + 6 * 60 * 60 * 1000 + 1), true);
  });

  test("IP berbeda tidak saling memblokir", () => {
    const now = 2_000_000_000_000;
    assert.equal(shouldNotify("10.0.0.4", now), true);
    assert.equal(shouldNotify("10.0.0.5", now), true);
  });
});

describe("visitMessage", () => {
  test("memuat IP, waktu WIB, dan merek", () => {
    const msg = visitMessage({
      ip: "1.2.3.4",
      path: "/tentang",
      device: "mobile",
      browser: "Chrome",
      phoneBrand: "Samsung",
      country: "ID",
      city: "Jakarta",
      createdAt: "2026-10-23T14:47:00.000Z",
    });
    assert.match(msg, /1\.2\.3\.4/);
    assert.match(msg, /21:47/);
    assert.match(msg, /Samsung/);
    assert.match(msg, /\/tentang/);
    assert.match(msg, /Jakarta, ID/);
  });

  test("merek null → tanda pisah, bukan string kosong", () => {
    const msg = visitMessage({
      ip: "5.6.7.8",
      path: "/",
      device: "desktop",
      browser: "Firefox",
      phoneBrand: null,
      country: null,
      city: null,
      createdAt: "2026-10-23T00:00:00.000Z",
    });
    assert.match(msg, /Merek\s+:\s—/);
    assert.match(msg, /Lokasi\s+:\s—/);
  });
});
