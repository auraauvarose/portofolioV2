import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { parseDevice } from "../src/lib/device.ts";

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
