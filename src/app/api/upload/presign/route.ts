import { NextRequest, NextResponse } from "next/server";
import { createPresignedUpload } from "@/lib/r2";
import { requireUser } from "@/lib/auth";
import { MAX_UPLOAD_BYTES } from "@/lib/config";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "application/pdf",
]);

const ALLOWED_FOLDERS = new Set(["projects", "certifications", "gallery", "test"]);

export async function POST(req: NextRequest) {
  const { error: authError } = await requireUser();
  if (authError) return authError;

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
    }

    const { filename, contentType, folder, size } = body as Record<string, unknown>;

    if (typeof filename !== "string" || !filename.trim()) {
      return NextResponse.json({ error: "filename wajib diisi." }, { status: 400 });
    }
    if (typeof contentType !== "string" || !contentType) {
      return NextResponse.json(
        { error: "contentType wajib diisi." },
        { status: 400 },
      );
    }

    const type = contentType.toLowerCase().split(";")[0].trim();
    if (!ALLOWED_TYPES.has(type)) {
      return NextResponse.json(
        {
          error: `Tipe file tidak diizinkan: ${type}. Gunakan gambar (JPEG, PNG, WebP, AVIF, GIF) atau PDF.`,
        },
        { status: 415 },
      );
    }

    if (typeof size !== "number" || !Number.isFinite(size) || size <= 0) {
      return NextResponse.json(
        { error: "size wajib diisi sebagai angka." },
        { status: 400 },
      );
    }
    if (size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        {
          error: `File terlalu besar. Maksimum ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB.`,
        },
        { status: 413 },
      );
    }

    const folderValue = typeof folder === "string" && folder ? folder : undefined;
    if (folderValue && !ALLOWED_FOLDERS.has(folderValue)) {
      return NextResponse.json(
        { error: `Folder tidak dikenal: ${folderValue}` },
        { status: 400 },
      );
    }

    const result = await createPresignedUpload({
      filename,
      contentType: type,
      folder: folderValue,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("presign error:", err);
    return NextResponse.json(
      { error: "Gagal membuat URL unggah." },
      { status: 500 },
    );
  }
}
