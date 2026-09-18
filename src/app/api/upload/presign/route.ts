import { NextRequest, NextResponse } from "next/server";
import { createPresignedUpload } from "@/lib/r2";
import { requireUser } from "@/lib/auth";
import { MAX_UPLOAD_BYTES } from "@/lib/config";

export const dynamic = "force-dynamic";

// ============================================================================
// Presign upload.
//
// Endpoint ini memberi URL PUT yang sudah ditandatangani ke R2. Tanpa
// pembatasan, sesi admin yang bocor bisa dipakai mengunggah file sembarang ke
// domain publik — termasuk HTML atau SVG yang, bila dibuka, menjalankan
// skrip di origin CDN.
//
// Tiga pembatasan di bawah menutup itu:
//   1. allowlist content-type  → hanya gambar & PDF
//   2. allowlist folder        → tidak bisa keluar dari struktur yang dikenal
//   3. ukuran wajib angka      → sebelumnya field `size` yang dihilangkan
//                                akan melewati batas 50 MB
// ============================================================================

/** Tipe yang boleh diunggah. Sengaja TIDAK termasuk image/svg+xml dan
 *  text/html — keduanya bisa membawa skrip. */
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "application/pdf",
]);

/** Folder yang dikenal. Nilai lain ditolak, bukan disanitasi diam-diam. */
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

    // 1. Content-type harus dari allowlist.
    const type = contentType.toLowerCase().split(";")[0].trim();
    if (!ALLOWED_TYPES.has(type)) {
      return NextResponse.json(
        {
          error: `Tipe file tidak diizinkan: ${type}. Gunakan gambar (JPEG, PNG, WebP, AVIF, GIF) atau PDF.`,
        },
        { status: 415 },
      );
    }

    // 2. Ukuran WAJIB angka — sebelumnya bisa dihilangkan untuk melewati batas.
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

    // 3. Folder harus dari allowlist.
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
    // Jangan bocorkan pesan internal ke klien.
    return NextResponse.json(
      { error: "Gagal membuat URL unggah." },
      { status: 500 },
    );
  }
}
