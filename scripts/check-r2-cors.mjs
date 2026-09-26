#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { AwsClient } from "aws4fetch";

const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME } =
  process.env;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  console.error(
    "Kredensial R2 belum lengkap di .env.local.\n" +
      "Butuh: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME",
  );
  process.exit(1);
}

const aws = new AwsClient({
  accessKeyId: R2_ACCESS_KEY_ID,
  secretAccessKey: R2_SECRET_ACCESS_KEY,
  service: "s3",
  region: "auto",
});

const corsUrl = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}?cors`;

const recommended = [
  {
    AllowedOrigins: ["*"],
    AllowedMethods: ["GET", "PUT", "HEAD"],
    AllowedHeaders: ["Content-Type", "*"],
    ExposeHeaders: ["ETag"],
    MaxAgeSeconds: 3600,
  },
];

async function getCors() {
  const res = await aws.fetch(corsUrl, { method: "GET" });
  if (res.status === 404) return { exists: false, rules: [] };
  if (!res.ok) {
    throw new Error(`Gagal membaca CORS (HTTP ${res.status})`);
  }
  const xml = await res.text();
  return { exists: true, rules: parseCorsXml(xml) };
}

function parseCorsXml(xml) {
  const rules = [];
  const blocks = xml.match(/<CORSRule>[\s\S]*?<\/CORSRule>/g) ?? [];
  for (const block of blocks) {
    const pick = (tag) =>
      [...block.matchAll(new RegExp(`<${tag}>([^<]*)</${tag}>`, "g"))].map(
        (m) => m[1],
      );
    rules.push({
      AllowedMethods: pick("AllowedMethod"),
      AllowedOrigins: pick("AllowedOrigin"),
      AllowedHeaders: pick("AllowedHeader"),
    });
  }
  return rules;
}

function allowsPut(rules) {
  return rules.some((r) => (r.AllowedMethods ?? []).includes("PUT"));
}

function toXml(rules) {
  const ruleXml = rules
    .map(
      (r) => `  <CORSRule>
${r.AllowedOrigins.map((o) => `    <AllowedOrigin>${o}</AllowedOrigin>`).join("\n")}
${r.AllowedMethods.map((m) => `    <AllowedMethod>${m}</AllowedMethod>`).join("\n")}
${r.AllowedHeaders.map((h) => `    <AllowedHeader>${h}</AllowedHeader>`).join("\n")}
${r.ExposeHeaders.map((h) => `    <ExposeHeader>${h}</ExposeHeader>`).join("\n")}
    <MaxAgeSeconds>${r.MaxAgeSeconds}</MaxAgeSeconds>
  </CORSRule>`,
    )
    .join("\n");
  return `<CORSConfiguration>\n${ruleXml}\n</CORSConfiguration>`;
}

const apply = process.argv.includes("--apply");

console.log(`Bucket: ${R2_BUCKET_NAME}`);

let current;
try {
  current = await getCors();
} catch (err) {
  console.error(`\n${err.message}`);
  console.error(
    "Periksa apakah R2 API token punya izin Object Read & Write pada bucket ini.",
  );
  process.exit(1);
}

if (!current.exists) {
  console.log("CORS: belum ada kebijakan.");
} else {
  console.log("CORS saat ini:");
  for (const r of current.rules) {
    console.log(
      `  methods=[${r.AllowedMethods.join(", ")}] origins=[${r.AllowedOrigins.join(", ")}]`,
    );
  }
}

const ok = current.exists && allowsPut(current.rules);

if (apply) {
  if (ok) {
    console.log("\nCORS sudah mengizinkan PUT — tidak ada perubahan.");
  } else {
    const res = await aws.fetch(corsUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/xml" },
      body: toXml(recommended),
    });
    if (!res.ok) {
      console.error(`\nGagal memasang CORS (HTTP ${res.status}).`);
      process.exit(1);
    }
    console.log("\nCORS dipasang: GET + PUT + HEAD, origin *.");
    console.log(
      'PENTING: ganti "*" dengan domain aslimu di produksi (lihat README).',
    );
  }
} else if (!current.exists) {
  console.log(
    "\nHASIL: belum ada CORS → unggahan dari browser akan gagal.\n" +
      "Jalankan ulang dengan --apply untuk memasangnya.",
  );
} else if (!ok) {
  console.log(
    "\nHASIL: kebijakan ada tapi PUT tidak diizinkan → unggahan akan gagal.\n" +
      "Jalankan ulang dengan --apply untuk memperbaikinya.",
  );
} else {
  console.log("\nHASIL: CORS mengizinkan PUT → unggahan seharusnya berfungsi.");
}
