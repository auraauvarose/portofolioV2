import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

import { adminPassword, sessionSecret } from "../src/lib/server-config.ts";

const ENV_KEYS = ["ADMIN_PASSWORD", "ADMIN_COOKIE_SECRET"] as const;

const ORIGINAL: Record<string, string | undefined> = {};
for (const key of ENV_KEYS) ORIGINAL[key] = process.env[key];

function restoreEnv(): void {
  for (const key of ENV_KEYS) {
    const value = ORIGINAL[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

beforeEach(() => {
  for (const key of ENV_KEYS) delete process.env[key];
});

afterEach(restoreEnv);

describe("adminPassword", () => {
  test("mengembalikan password dari env", () => {
    process.env.ADMIN_PASSWORD = "rahasia-admin";
    assert.equal(adminPassword(), "rahasia-admin");
  });

  test("memangkas spasi di ujung", () => {
    process.env.ADMIN_PASSWORD = "  rahasia-admin  ";
    assert.equal(adminPassword(), "rahasia-admin");
  });

  test("env tidak diset -> string kosong (fail-closed, tanpa default hardcoded)", () => {
    assert.equal(adminPassword(), "");
  });

  test("env hanya spasi -> string kosong", () => {
    process.env.ADMIN_PASSWORD = "   ";
    assert.equal(adminPassword(), "");
  });
});

describe("sessionSecret", () => {
  test("memakai ADMIN_COOKIE_SECRET bila diisi", () => {
    process.env.ADMIN_COOKIE_SECRET = "secret-cookie";
    assert.equal(sessionSecret(), "secret-cookie");
  });

  test("memangkas spasi di ujung", () => {
    process.env.ADMIN_COOKIE_SECRET = "  secret-cookie  ";
    assert.equal(sessionSecret(), "secret-cookie");
  });

  test("TIDAK memakai ADMIN_PASSWORD sebagai fallback", () => {
    process.env.ADMIN_PASSWORD = "password-admin-yang-panjang";
    assert.equal(sessionSecret(), "");
  });

  test("ADMIN_COOKIE_SECRET kosong -> menolak walau ADMIN_PASSWORD diisi", () => {
    process.env.ADMIN_PASSWORD = "password-admin-yang-panjang";
    process.env.ADMIN_COOKIE_SECRET = "";
    assert.equal(sessionSecret(), "", "secret kosong harus fail-closed");

    process.env.ADMIN_COOKIE_SECRET = "   ";
    assert.equal(sessionSecret(), "", "secret hanya spasi harus fail-closed");
  });

  test("kedua env kosong -> string kosong", () => {
    assert.equal(sessionSecret(), "");
  });

  test("secret dan password terpisah, tidak saling bocor", () => {
    process.env.ADMIN_PASSWORD = "password-admin";
    process.env.ADMIN_COOKIE_SECRET = "secret-cookie";
    assert.equal(sessionSecret(), "secret-cookie");
    assert.equal(adminPassword(), "password-admin");
    assert.notEqual(sessionSecret(), adminPassword());
  });

  test("hasil deterministik terhadap env (dipanggil berulang)", () => {
    process.env.ADMIN_COOKIE_SECRET = "secret-cookie";
    assert.equal(sessionSecret(), sessionSecret());
    delete process.env.ADMIN_COOKIE_SECRET;
    assert.equal(sessionSecret(), sessionSecret());
    assert.equal(sessionSecret(), "");
  });

  test("perubahan env langsung terlihat tanpa cache modul", () => {
    assert.equal(sessionSecret(), "");
    process.env.ADMIN_COOKIE_SECRET = "pertama";
    assert.equal(sessionSecret(), "pertama");
    process.env.ADMIN_COOKIE_SECRET = "kedua";
    assert.equal(sessionSecret(), "kedua");
  });
});
