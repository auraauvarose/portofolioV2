import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  MAX_NAME,
  MAX_PURPOSE,
  certificateRequestMessage,
  parseCertificateRequest,
} from "../src/lib/certificate-request.ts";

describe("parseCertificateRequest", () => {
  test("menolak nama kosong / terlalu pendek", () => {
    const r = parseCertificateRequest({ name: " a ", purpose: "lihat" });
    assert.equal(r.ok, false);
    assert.equal(r.ok === false && r.error, "Nama minimal 2 karakter.");
  });

  test("menolak tujuan kosong / terlalu pendek", () => {
    const r = parseCertificateRequest({ name: "Ani", purpose: "  x " });
    assert.equal(r.ok, false);
    assert.equal(r.ok === false && r.error, "Tujuan minimal 3 karakter.");
  });

  test("menolak body bukan objek", () => {
    for (const body of [null, "teks", 42, []]) {
      const r = parseCertificateRequest(body);
      assert.equal(r.ok, false);
      assert.equal(r.ok === false && r.error, "Data tidak valid.");
    }
  });

  test("trim dan potong panjang nama/tujuan", () => {
    const r = parseCertificateRequest({
      name: `  ${"n".repeat(MAX_NAME + 20)}  `,
      purpose: `  ${"p".repeat(MAX_PURPOSE + 20)}  `,
    });
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.value.name.length, MAX_NAME);
      assert.equal(r.value.purpose.length, MAX_PURPOSE);
    }
  });
});

describe("certificateRequestMessage", () => {
  test("memuat nama, tujuan, dan IP", () => {
    const text = certificateRequestMessage({
      name: "Budi",
      purpose: "Verifikasi lamaran kerja",
      ip: "1.2.3.4",
    });
    assert.match(text, /Budi/);
    assert.match(text, /Verifikasi lamaran kerja/);
    assert.match(text, /1\.2\.3\.4/);
  });
});
