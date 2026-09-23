import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { parseBrowser, parseDevice, parsePhoneBrand } from "../src/lib/device.ts";

// ============================================================================
// parseDevice — klasifikasi perangkat dari user-agent untuk analitik.
// Kontrak: mobile / tablet / desktop; UA asli tidak disimpan di mana pun.
// ============================================================================

describe("parseDevice", () => {
  test("iPhone → mobile", () => {
    assert.equal(
      parseDevice(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      ),
      "mobile",
    );
  });

  test("Android ponsel → mobile", () => {
    assert.equal(
      parseDevice(
        "Mozilla/5.0 (Linux; Android 14; SM-A536E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36",
      ),
      "mobile",
    );
  });

  test("iPad → tablet", () => {
    assert.equal(
      parseDevice(
        "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      ),
      "tablet",
    );
  });

  test("Android tablet (tanpa kata Mobile) → tablet", () => {
    assert.equal(
      parseDevice(
        "Mozilla/5.0 (Linux; Android 13; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      ),
      "tablet",
    );
  });

  test("desktop Windows → desktop", () => {
    assert.equal(
      parseDevice(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      ),
      "desktop",
    );
  });

  test("UA kosong/null → desktop (fallback aman)", () => {
    assert.equal(parseDevice(null), "desktop");
    assert.equal(parseDevice(""), "desktop");
  });

  test("UA asing → desktop", () => {
    assert.equal(parseDevice("bot-crawler-xyz"), "desktop");
  });
});

// ============================================================================
// parseBrowser — browser dari user-agent. Kontrak: nama browser, "Lainnya"
// untuk UA tak dikenal, null untuk UA kosong (tidak dihitung).
// ============================================================================

const UA = {
  chromeWin:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  edge:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
  opera:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0",
  samsung:
    "Mozilla/5.0 (Linux; Android 14; SM-A536E) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0 Mobile Safari/537.36",
  firefox:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
  safariIphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
};

describe("parseBrowser", () => {
  test("Chrome desktop → Chrome", () => {
    assert.equal(parseBrowser(UA.chromeWin), "Chrome");
  });

  test("Edge (memuat 'Chrome') → Edge, bukan Chrome", () => {
    assert.equal(parseBrowser(UA.edge), "Edge");
  });

  test("Opera (memuat 'Chrome') → Opera, bukan Chrome", () => {
    assert.equal(parseBrowser(UA.opera), "Opera");
  });

  test("Samsung Internet (memuat 'Chrome') → Samsung Internet", () => {
    assert.equal(parseBrowser(UA.samsung), "Samsung Internet");
  });

  test("Firefox → Firefox", () => {
    assert.equal(parseBrowser(UA.firefox), "Firefox");
  });

  test("Safari iPhone → Safari", () => {
    assert.equal(parseBrowser(UA.safariIphone), "Safari");
  });

  test("Edge iOS / Opera iOS (memuat 'Safari' saja) → tetap terdeteksi", () => {
    assert.equal(
      parseBrowser(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 EdgiOS/120.0 Mobile/15E148 Safari/604.1",
      ),
      "Edge",
    );
    assert.equal(
      parseBrowser(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) OPiOS/2.2.0 Mobile/15E148 Safari/9537.53",
      ),
      "Opera",
    );
  });

  test("UA kosong/null → null (tidak dihitung)", () => {
    assert.equal(parseBrowser(null), null);
    assert.equal(parseBrowser(""), null);
  });

  test("UA tak dikenal → 'Lainnya'", () => {
    assert.equal(parseBrowser("bot-crawler-xyz"), "Lainnya");
  });
});

// ============================================================================
// parsePhoneBrand — merek ponsel. Hanya untuk perangkat mobile: UA desktop
// tidak punya merek, jadi null (bukan "Lainnya").
// ============================================================================

describe("parsePhoneBrand", () => {
  test("iPhone → Apple", () => {
    assert.equal(parsePhoneBrand(UA.safariIphone), "Apple");
  });

  test("Samsung (SM-A536E) → Samsung", () => {
    assert.equal(parsePhoneBrand(UA.samsung), "Samsung");
  });

  test("Redmi/POCO → Xiaomi", () => {
    assert.equal(
      parsePhoneBrand(
        "Mozilla/5.0 (Linux; Android 13; Redmi Note 12) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36",
      ),
      "Xiaomi",
    );
    assert.equal(
      parsePhoneBrand(
        "Mozilla/5.0 (Linux; Android 13; POCO F5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36",
      ),
      "Xiaomi",
    );
  });

  test("Oppo / Vivo / Realme / Infinix → merek masing-masing", () => {
    const mk = (token: string) =>
      `Mozilla/5.0 (Linux; Android 13; ${token}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36`;
    assert.equal(parsePhoneBrand(mk("CPH2451 OPPO")), "Oppo");
    assert.equal(parsePhoneBrand(mk("vivo 1906")), "Vivo");
    assert.equal(parsePhoneBrand(mk("RMX3630 realme")), "Realme");
    assert.equal(parsePhoneBrand(mk("Infinix X6819")), "Infinix");
  });

  test("ponsel tak dikenal → 'Lainnya'", () => {
    assert.equal(
      parsePhoneBrand(
        "Mozilla/5.0 (Linux; Android 13; MerekAneh) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36",
      ),
      "Lainnya",
    );
  });

  test("desktop → null (bukan 'Lainnya' — desktop tidak punya merek)", () => {
    assert.equal(parsePhoneBrand(UA.chromeWin), null);
    assert.equal(parsePhoneBrand(null), null);
  });
});
