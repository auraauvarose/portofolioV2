import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { parseTier } from "../src/lib/perf-tier.ts";

describe("parseTier", () => {
  test("reducedMotion → off", () => {
    assert.equal(
      parseTier({ hardwareConcurrency: 16, deviceMemory: 16, reducedMotion: true }),
      "off",
    );
  });

  test("saveData → low (bukan off, bukan high)", () => {
    assert.equal(
      parseTier({
        hardwareConcurrency: 16,
        deviceMemory: 16,
        reducedMotion: false,
        saveData: true,
      }),
      "low",
    );
  });

  test("reducedMotion menang atas saveData → off", () => {
    assert.equal(
      parseTier({ hardwareConcurrency: 16, deviceMemory: 16, reducedMotion: true, saveData: true }),
      "off",
    );
  });

  test("8 cores / 8 GB → high", () => {
    assert.equal(
      parseTier({ hardwareConcurrency: 8, deviceMemory: 8, reducedMotion: false }),
      "high",
    );
  });

  test("4 cores / 4 GB → low", () => {
    assert.equal(
      parseTier({ hardwareConcurrency: 4, deviceMemory: 4, reducedMotion: false }),
      "low",
    );
  });

  test("semua undefined → low (default cores/mem = 4)", () => {
    assert.equal(parseTier({ reducedMotion: false }), "low");
  });

  test("cores 16 / mem 4 → low (AND, bukan OR)", () => {
    assert.equal(
      parseTier({ hardwareConcurrency: 16, deviceMemory: 4, reducedMotion: false }),
      "low",
    );
  });

  test("cores 4 / mem 16 → low (AND, bukan OR)", () => {
    assert.equal(
      parseTier({ hardwareConcurrency: 4, deviceMemory: 16, reducedMotion: false }),
      "low",
    );
  });

  test("saveData false tidak menurunkan tier high", () => {
    assert.equal(
      parseTier({ hardwareConcurrency: 8, deviceMemory: 8, reducedMotion: false, saveData: false }),
      "high",
    );
  });
});
