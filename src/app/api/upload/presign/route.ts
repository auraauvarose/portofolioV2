import { NextRequest, NextResponse } from "next/server";
import { createPresignedUpload } from "@/lib/r2";
import { requireUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { error: authError } = await requireUser();
  if (authError) return authError;

  try {
    const body = await req.json();
    const { filename, contentType, folder } = body ?? {};

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: "filename and contentType are required" },
        { status: 400 },
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
