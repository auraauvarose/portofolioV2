import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  CERT_SUBJECT,
  MAX_NAME,
  MAX_PURPOSE,
  certificateAccess,
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

describe("certificateAccess", () => {
  test("tanpa baris / bukan permintaan sertifikat → none", () => {
    assert.equal(certificateAccess(null), "none");
    assert.equal(certificateAccess(undefined), "none");
    assert.equal(
      certificateAccess({ subject: "Halo", status: "replied" }),
      "none",
    );
  });

  test("status replied = disetujui, archived = ditolak", () => {
    assert.equal(
      certificateAccess({ subject: CERT_SUBJECT, status: "replied" }),
      "approved",
    );
    assert.equal(
      certificateAccess({ subject: CERT_SUBJECT, status: "archived" }),
      "denied",
    );
  });

  test("status new/read masih menunggu", () => {
    for (const status of ["new", "read"]) {
      assert.equal(
        certificateAccess({ subject: CERT_SUBJECT, status }),
        "pending",
      );
    }
  });
});
