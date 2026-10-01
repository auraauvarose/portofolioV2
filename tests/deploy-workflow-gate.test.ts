import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Gate CI hanya bisa diverifikasi secara lokal dengan membaca workflow-nya —
 * tidak ada runner GitHub di mesin ini. Berkas ini mengunci tiga hal yang
 * sebelumnya bocor:
 *
 *  1. `tsx --test` mencetak "tests 0" dan tetap exit 0, jadi deploy bisa lolos
 *     tanpa satu tes pun (mis. folder tests/ ter-rename).
 *  2. Tidak ada trigger `pull_request`, jadi gate kualitas hanya jalan setelah
 *     merge.
 *  3. Workflow yang sama juga melakukan deploy — PR (termasuk dari fork) tidak
 *     boleh sampai men-deploy.
 *
 * Workflow dibaca sebagai teks dan diperiksa per blok, tanpa paket YAML: `yaml`
 * hanya tersedia sebagai dependensi transitif (@opennextjs/aws) dan tidak
 * dideklarasikan di package.json, jadi menumbuhkan tes di atasnya rapuh.
 *
 * DEPLOY_WORKFLOW_PATH bisa diarahkan ke berkas lain untuk menguji tes ini
 * sendiri terhadap workflow versi lama (lihat riwayat commit).
 */

const WORKFLOW_PATH =
  process.env.DEPLOY_WORKFLOW_PATH ??
  resolve(process.cwd(), ".github/workflows/deploy.yml");

const workflow = readFileSync(WORKFLOW_PATH, "utf8");
const lines = workflow.split("\n");

/** Baris (1-based) tempat blok top-level `key:` dimulai, atau -1. */
function topLevelLine(key: string): number {
  return lines.findIndex((line) => line === `${key}:`);
}

/** Isi blok top-level `key:` sampai key top-level berikutnya. */
function topLevelBlock(key: string): string {
  const start = topLevelLine(key);
  assert.notEqual(start, -1, `blok top-level '${key}:' tidak ditemukan`);
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^[A-Za-z_]/.test(lines[i])) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join("\n");
}

/** Isi job `name:` (indentasi dua spasi) sampai job berikutnya. */
function jobBlock(name: string): string {
  const start = lines.findIndex((line) => line === `  ${name}:`);
  assert.notEqual(start, -1, `job '${name}' tidak ditemukan`);
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^  [A-Za-z_][\w-]*:/.test(lines[i])) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join("\n");
}

/** Isi step `- name: <name>` sampai step berikutnya. */
function stepBlock(jobName: string, stepName: string): string {
  const jobLines = jobBlock(jobName).split("\n");
  const start = jobLines.findIndex((line) => line.trim() === `- name: ${stepName}`);
  assert.notEqual(start, -1, `step '${stepName}' tidak ditemukan di job '${jobName}'`);
  let end = jobLines.length;
  for (let i = start + 1; i < jobLines.length; i++) {
    if (/^\s*- name:/.test(jobLines[i])) {
      end = i;
      break;
    }
  }
  return jobLines.slice(start, end).join("\n");
}

describe("trigger workflow", () => {
  const on = topLevelBlock("on");

  test("masih jalan pada push ke main/master", () => {
    assert.match(on, /^ {2}push:$/m, "trigger push hilang");
    assert.match(on, /^ {2}push:\n {4}branches: \[main, master\]$/m);
  });

  test("masih bisa dijalankan manual", () => {
    assert.match(on, /^ {2}workflow_dispatch:$/m, "workflow_dispatch hilang");
  });

  test("jalan pada pull_request ke main/master", () => {
    assert.match(on, /^ {2}pull_request:$/m, "trigger pull_request tidak ada");
    assert.match(
      on,
      /^ {2}pull_request:\n {4}branches: \[main, master\]$/m,
      "pull_request tidak dibatasi ke main/master",
    );
  });
});

describe("job deploy tidak boleh jalan pada pull_request", () => {
  const deploy = jobBlock("deploy");

  test("deploy punya kondisi yang mengecualikan pull_request", () => {
    const match = deploy.match(/^ {4}if: (.+)$/m);
    assert.ok(match, "job deploy tidak punya 'if'");
    assert.match(
      match[1].trim(),
      /^github\.event_name\s*!=\s*'pull_request'$/,
      `kondisi deploy harus mengecualikan pull_request, dapat: ${match[1].trim()}`,
    );
  });

  test("build/deploy/secret tidak berada di job yang jalan saat PR", () => {
    const quality = jobBlock("quality");
    for (const forbidden of ["cf:build", "wrangler deploy", "wrangler secret bulk"]) {
      assert.ok(
        !quality.includes(forbidden),
        `job 'quality' (jalan saat PR) tidak boleh menjalankan ${forbidden}`,
      );
    }
  });

  test("langkah berbahaya tetap ada di job deploy", () => {
    for (const required of ["cf:build", "wrangler deploy", "wrangler secret bulk"]) {
      assert.ok(
        deploy.includes(required),
        `job deploy kehilangan langkah '${required}'`,
      );
    }
  });

  test("job deploy menunggu gate kualitas", () => {
    const match = deploy.match(/^ {4}needs: (.+)$/m);
    assert.ok(match, "job deploy tidak punya 'needs'");
    assert.match(match[1], /quality/);
  });
});

describe("gate jumlah tes nol", () => {
  const run = stepBlock("quality", "Test");

  test("langkah Test ada dan menjalankan npm test", () => {
    assert.match(run, /npm test/);
  });

  test("memakai pipefail supaya kegagalan npm test tidak tertelan tee", () => {
    assert.match(run, /set -o pipefail/);
  });

  // `set -o pipefail` saja TIDAK cukup: skrip berakhir dengan `echo`, jadi step
  // tetap exit 0 meski `npm test` merah. Status pipeline harus ditangkap dan
  // diteruskan sebagai exit code.
  test("meneruskan kegagalan npm test sebagai exit code step", () => {
    assert.match(run, /^\s*status=\$\?$/m, "status pipeline tidak ditangkap");
    assert.match(run, /if \[ "\$status" -ne 0 \]/, "status pipeline tidak diperiksa");
    assert.match(run, /exit "\$status"/, "status pipeline tidak diteruskan");
  });

  test("output tes ditangkap ke berkas", () => {
    assert.match(run, /tee \/tmp\/test-output\.txt/);
  });

  test("menghitung jumlah tes dari baris 'tests N'", () => {
    assert.match(run, /grep -aE '\^\(ℹ\|#\) tests \[0-9\]\+\[\[:space:\]\]\*\$'/);
  });

  test("gagal bila jumlah tes 0", () => {
    assert.match(run, /tests 0/, "tidak ada pemeriksaan 'tests 0'");
    assert.match(run, /if \[ "\$count" -eq 0 \]/, "tidak ada perbandingan count ke 0");
    assert.match(run, /exit 1/, "tidak ada exit 1 saat tes nol");
  });

  test("gagal juga bila jumlah tes tidak terbaca", () => {
    assert.match(run, /if \[ -z "\$count" \]/, "tidak ada pemeriksaan output kosong");
  });

  test("lint dan typecheck tetap ada di gate", () => {
    const quality = jobBlock("quality");
    assert.match(stepBlock("quality", "Lint"), /npm run lint/);
    assert.match(stepBlock("quality", "Typecheck"), /npm run typecheck/);
    assert.ok(quality.includes("npm ci"), "langkah install hilang");
    assert.ok(quality.includes("actions/checkout@v4"), "checkout hilang");
  });
});
