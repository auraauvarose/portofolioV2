import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin, withJsonErrors } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth";
import { invalidateTable } from "@/lib/revalidate-content";

// ============================================================================
// Reorder — simpan urutan konten.
//
// Menyimpan `sort_order` = posisi indeks untuk sekumpulan id sekaligus.
// Dipakai oleh drag-and-drop di /admin (Projects, Certifications, Gallery).
//
// Endpoint ini ada supaya urutan bisa diubah tanpa menembak PUT per baris
// (yang juga akan memicu pembersihan R2 & validasi field yang tidak perlu).
// ============================================================================

/** Tabel yang boleh diurutkan ulang — daftar putih, bukan input bebas. */
const TABLES = [
  "projects",
  "certifications",
  "gallery_photos",
  "experience",
  "testimonials",
] as const;
type Table = (typeof TABLES)[number];

function isTable(v: unknown): v is Table {
  return typeof v === "string" && (TABLES as readonly string[]).includes(v);
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const POST = withJsonErrors(async function POST(req: NextRequest) {
  const { error: authError } = await requireUser();
  if (authError) return authError;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const { table, ids } = body as { table?: unknown; ids?: unknown };

  if (!isTable(table)) {
    return NextResponse.json({ error: "Tabel tidak dikenal." }, { status: 400 });
  }
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids wajib berupa array." }, { status: 400 });
  }
  if (ids.length > 500) {
    return NextResponse.json({ error: "Terlalu banyak item." }, { status: 400 });
  }
  // Setiap id harus UUID yang valid — mencegah injeksi ke filter .eq().
  if (!ids.every((id) => typeof id === "string" && UUID_RE.test(id))) {
    return NextResponse.json({ error: "Ada id yang tidak valid." }, { status: 400 });
  }
  if (new Set(ids).size !== ids.length) {
    return NextResponse.json({ error: "Ada id duplikat." }, { status: 400 });
  }

  const supabase = await createSupabaseAdmin();

  // Tulis sort_order = indeks. Dijalankan berurutan agar kegagalan di tengah
  // tidak meninggalkan urutan yang setengah jadi tanpa kita ketahui.
  for (let i = 0; i < ids.length; i++) {
    const { error } = await supabase
      .from(table)
      .update({ sort_order: i })
      .eq("id", ids[i]);

    if (error) {
      console.error(`reorder ${table} gagal pada indeks ${i}:`, error.message);
      return NextResponse.json(
        { error: "Gagal menyimpan urutan." },
        { status: 500 },
      );
    }
  }

  invalidateTable(table);
  return NextResponse.json({ ok: true, count: ids.length });
});
