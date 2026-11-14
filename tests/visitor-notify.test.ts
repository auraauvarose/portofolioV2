import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { shouldNotify, visitMessage } from "../src/lib/visitor-notify.ts";
import { NextRequest } from "next/server";
import { POST } from "../src/app/api/analytics/route.ts";

test("analytics memakai model browser serta lokasi request Cloudflare; Node tetap aman", async (t) => {
  const keys = ["NEXT_PUBLIC_ANALYTICS_ENABLED", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "TELEGRAM_BOT_TOKEN"] as const;
  const previous = keys.map((key) => process.env[key]);
  const symbol = Symbol.for("__cloudflare-context__");
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, symbol);
  t.after(() => {
    keys.forEach((key, i) => {
      if (previous[i] === undefined) delete process.env[key];
      else process.env[key] = previous[i];
    });
    if (descriptor) Object.defineProperty(globalThis, symbol, descriptor);
    else Reflect.deleteProperty(globalThis, symbol);
  });
  process.env.NEXT_PUBLIC_ANALYTICS_ENABLED = "true";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://analytics-test.invalid";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-only-key";
  process.env.TELEGRAM_BOT_TOKEN = "";
  const inserts: Record<string, unknown>[] = [];
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request, init?: RequestInit) => {
    assert.match(String(input), /^https:\/\/analytics-test\.invalid\/rest\/v1\/page_views/);
    inserts.push(JSON.parse(String(init?.body)));
    return Response.json(null, { status: 201 });
  });
  Object.defineProperty(globalThis, symbol, {
    configurable: true,
    value: { cf: { country: "ID", region: "Jawa Tengah", city: "Surakarta" } },
  });
  const headers = {
    "content-type": "application/json", "cf-ipcountry": "SG", "cf-connecting-ip": "203.0.113.201",
    "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/142.0.0.0 Mobile Safari/537.36",
  };
  const response = await POST(new NextRequest("https://site.invalid/api/analytics", {
    method: "POST", headers, body: JSON.stringify({ path: "/", model: "SM-A536E" }),
  }), undefined);
  assert.equal(response.status, 200);
  assert.equal(inserts[0].phone_brand, "Samsung");
  assert.equal(inserts[0].country, "ID");
  assert.equal(inserts[0].city, "Jawa Tengah - Surakarta");
  Reflect.deleteProperty(globalThis, symbol);
  const local = await POST(new NextRequest("https://site.invalid/api/analytics", {
    method: "POST", headers: { ...headers, "cf-connecting-ip": "203.0.113.202" },
    body: JSON.stringify({ path: "/", model: { invalid: true } }),
  }), undefined);
  assert.equal(local.status, 200);
  assert.equal(inserts[1].country, "SG");
  assert.equal(inserts[1].city, null);
  assert.equal(inserts[1].phone_brand, null);
});

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
    assert.match(msg, /ID - Jakarta/);
  });

  test("provinsi dan kota tersedia dalam format negara–provinsi–kota", () => {
    const msg = visitMessage({
      ip: "203.0.113.9", path: "/", device: "mobile", browser: "Chrome",
      phoneBrand: "Samsung", country: "ID", city: "Jawa Tengah - Surakarta",
      createdAt: "2026-11-14T00:00:00Z",
    });
    assert.match(msg, /Lokasi\s+:\sID - Jawa Tengah - Surakarta/);
  });

  test("merek null → keterangan jujur, bukan merek buatan", () => {
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
    assert.match(msg, /Merek\s+:\sTidak terdeteksi/);
    assert.match(msg, /Lokasi\s+:\s—/);
  });
});
