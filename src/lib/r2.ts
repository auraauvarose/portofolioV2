import { AwsV4Signer, AwsClient } from "aws4fetch";

function getR2Credentials() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials are not configured.");
  }

  return { accountId, accessKeyId, secretAccessKey };
}

function getObjectKeyUrl(accountId: string, bucket: string, key: string): string {
  return `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`;
}

export type PresignedUpload = {
  key: string;
  url: string;
  publicUrl: string;
};

export async function createPresignedUpload(params: {
  filename: string;
  contentType: string;
  folder?: string;
}): Promise<PresignedUpload> {
  const bucket = process.env.R2_BUCKET_NAME;
  const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  const { accountId, accessKeyId, secretAccessKey } = getR2Credentials();
  if (!bucket) throw new Error("R2_BUCKET_NAME is not configured.");
  if (!publicBase) throw new Error("NEXT_PUBLIC_R2_PUBLIC_URL is not configured.");

  const clean = params.filename.replace(/[^a-zA-Z0-9._-]/g, "-");
  const folder = params.folder ? params.folder.replace(/^\/+|\/+$/g, "") : "";
  const prefix = folder ? `${folder}/` : "";
  const key = `${prefix}${Date.now()}-${crypto.randomUUID()}-${clean}`;

  const objectUrl = new URL(getObjectKeyUrl(accountId, bucket, key));
  objectUrl.searchParams.set("X-Amz-Expires", "3600");

  const signer = new AwsV4Signer({
    url: objectUrl.toString(),
    method: "PUT",
    accessKeyId,
    secretAccessKey,
    service: "s3",
    region: "auto",
    signQuery: true,
    headers: { "Content-Type": params.contentType },
  });

  const { url } = await signer.sign();

  return {
    key,
    url: url.toString(),
    publicUrl: `${publicBase.replace(/\/+$/, "")}/${key}`,
  };
}

export async function deleteR2Object(key: string): Promise<void> {
  const bucket = process.env.R2_BUCKET_NAME;
  const { accountId, accessKeyId, secretAccessKey } = getR2Credentials();
  if (!bucket) throw new Error("R2_BUCKET_NAME is not configured.");

  const aws = new AwsClient({ accessKeyId, secretAccessKey, service: "s3", region: "auto" });
  const url = getObjectKeyUrl(accountId, bucket, key);
  const res = await aws.fetch(url, { method: "DELETE" });

  if (!res.ok && res.status !== 404) {
    throw new Error(`Failed to delete object from R2 (${res.status})`);
  }
}
