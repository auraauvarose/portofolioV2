import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials are not configured.");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    // The presigned PUT is later replayed by a plain browser `fetch()`, which
    // cannot recompute the CRC32 checksum that the SDK otherwise injects into
    // the presigned URL by default (`WHEN_SUPPORTED`). That baked-in placeholder
    // checksum (`x-amz-checksum-crc32=AAAAAA==`) makes R2 reject the real file
    // body with a 400 Bad Request. Only calculate checksums when the model
    // requires them, so the presigned URL carries no checksum at all and the
    // direct browser upload succeeds.
    requestChecksumCalculation: "WHEN_REQUIRED",
  });
}

export type PresignedUpload = {
  key: string;
  url: string;
  publicUrl: string;
};

/**
 * Generate a presigned PUT url so the browser can upload a file directly to R2.
 */
export async function createPresignedUpload(params: {
  filename: string;
  contentType: string;
  folder?: string;
}): Promise<PresignedUpload> {
  const bucket = process.env.R2_BUCKET_NAME;
  const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (!bucket) throw new Error("R2_BUCKET_NAME is not configured.");
  if (!publicBase) throw new Error("NEXT_PUBLIC_R2_PUBLIC_URL is not configured.");

  // Sanitize filename and build a collision-free key.
  const clean = params.filename.replace(/[^a-zA-Z0-9._-]/g, "-");
  const folder = params.folder ? params.folder.replace(/^\/+|\/+$/g, "") : "";
  const prefix = folder ? `${folder}/` : "";
  const key = `${prefix}${Date.now()}-${crypto.randomUUID()}-${clean}`;

  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: params.contentType,
    CacheControl: "public, max-age=31536000, immutable",
  });

  const url = await getSignedUrl(client, command, { expiresIn: 3600 });

  return {
    key,
    url,
    publicUrl: `${publicBase.replace(/\/+$/, "")}/${key}`,
  };
}

export async function deleteR2Object(key: string): Promise<void> {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error("R2_BUCKET_NAME is not configured.");
  const client = getR2Client();
  await client.send(
    new DeleteObjectCommand({ Bucket: bucket, Key: key }),
  );
}
