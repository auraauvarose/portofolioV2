/**
 * Inspect and (optionally) set the CORS policy on the Cloudflare R2 bucket.
 *
 * R2 is S3-compatible, so this uses the AWS S3 API against the R2 endpoint.
 *
 * Usage:
 *   node scripts/check-r2-cors.mjs            # read-only: print current CORS
 *   node scripts/check-r2-cors.mjs --apply    # set the README CORS policy if absent
 */
import fs from "node:fs";
import path from "node:path";
import {
  GetBucketCorsCommand,
  PutBucketCorsCommand,
} from "@aws-sdk/client-s3";
import { S3Client } from "@aws-sdk/client-s3";

// Load environment from .env.local (project root) without needing dotenv.
const root = process.cwd();
const envPath = path.join(root, ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if (
      val.startsWith('"') && val.endsWith('"') ||
      val.startsWith("'") && val.endsWith("'")
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET_NAME;

if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
  console.error(
    "Missing one of R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET_NAME in .env.local",
  );
  process.exit(1);
}

const client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

// The CORS policy documented in README §2 / FINAL-NOTES §5.
const recommendedRules = [
  {
    AllowedOrigins: ["*"],
    AllowedMethods: ["GET", "PUT", "HEAD"],
    AllowedHeaders: ["Content-Type", "*"],
    ExposeHeaders: ["ETag"],
    MaxAgeSeconds: 3600,
  },
];

async function getCors() {
  try {
    const res = await client.send(
      new GetBucketCorsCommand({ Bucket: bucket }),
    );
    return res.CORSRules ?? [];
  } catch (err) {
    if (String(err?.$metadata?.httpStatusCode) === "404") {
      return []; // no CORS policy configured
    }
    throw err;
  }
}

const apply = process.argv.includes("--apply");

console.log(`Bucket: ${bucket}`);
const current = await getCors();
console.log("Current CORS rules:", JSON.stringify(current, null, 2));

const missing = current.length === 0;
const allowsPut =
  current.some(
    (r) => (r.AllowedMethods ?? []).includes("PUT") &&
      (r.AllowedOrigins ?? []).includes("*") ||
      (r.AllowedOrigins ?? []).some((o) => o !== "*"),
  );

if (apply) {
  // Only overwrite when there is no policy, or when it doesn't allow PUT.
  if (missing || !allowsPut) {
    await client.send(
      new PutBucketCorsCommand({
        Bucket: bucket,
        CORSConfiguration: { CORSRules: recommendedRules },
      }),
    );
    console.log("Applied README CORS policy (PUT + GET + HEAD, origins *).");
  } else {
    console.log("CORS already allows PUT — no change applied.");
  }
  const after = await getCors();
  console.log("Rules after:", JSON.stringify(after, null, 2));
} else {
  if (missing) {
    console.log("RESULT: NO CORS policy configured → browser PUT uploads will fail (CORS).");
    console.log("Re-run with --apply to set the README policy.");
  } else if (!allowsPut) {
    console.log("RESULT: Policy exists but does not allow PUT → browser uploads will fail.");
  } else {
    console.log("RESULT: CORS allows PUT → uploads should work.");
  }
}
