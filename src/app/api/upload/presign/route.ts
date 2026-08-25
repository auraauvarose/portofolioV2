import { NextRequest, NextResponse } from "next/server";
import { createPresignedUpload } from "@/lib/r2";
import { requireUser } from "@/lib/auth";
import { MAX_UPLOAD_BYTES } from "@/lib/config";

export async function POST(req: NextRequest) {
  const { error: authError } = await requireUser();
  if (authError) return authError;

  try {
    const body = await req.json();
    const { filename, contentType, folder, size } = body ?? {};

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: "filename and contentType are required" },
        { status: 400 },
      );
    }

    if (typeof size === "number" && size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        {
          error: `File too large. Maximum allowed is 50 MB (${MAX_UPLOAD_BYTES} bytes).`,
        },
        { status: 413 },
      );
    }

    const result = await createPresignedUpload({
      filename: String(filename),
      contentType: String(contentType),
      folder: folder ? String(folder) : undefined,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("presign error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create upload" },
      { status: 500 },
    );
  }
}
