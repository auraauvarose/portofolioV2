import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin, withJsonErrors } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth";
import { invalidateTable } from "@/lib/revalidate-content";
import { validateReorderPayload } from "@/lib/reorder-validation";

export const POST = withJsonErrors(async function POST(req: NextRequest) {
  const { error: authError } = await requireUser();
  if (authError) return authError;

  const body = await req.json().catch(() => null);
  const check = validateReorderPayload(body);
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: 400 });
  }
  const { table, ids } = check;

  const supabase = await createSupabaseAdmin();

  // Satu UPDATE per baris masih belum transaksional (butuh RPC Postgres untuk
  // itu), tapi sekarang tiap baris diverifikasi: id yang tidak ada tidak lagi
  // dilaporkan sebagai sukses, dan kegagalan menyebutkan baris ke berapa.
  const missing: string[] = [];

  for (let i = 0; i < ids.length; i++) {
    const { data, error } = await supabase
      .from(table)
      .update({ sort_order: i })
      .eq("id", ids[i])
      .select("id");

    if (error) {
      console.error(`reorder ${table} gagal pada indeks ${i}:`, error.message);
      return NextResponse.json(
        {
          error: `Gagal menyimpan urutan pada item ke-${i + 1} dari ${ids.length}.`,
        },
        { status: 500 },
      );
    }
    if (!data || data.length === 0) missing.push(ids[i]);
  }

  if (missing.length > 0) {
    return NextResponse.json(
      {
        error: `${missing.length} item tidak ditemukan sehingga urutannya tidak lengkap.`,
        missing,
      },
      { status: 409 },
    );
  }

  invalidateTable(table);
  return NextResponse.json({ ok: true, count: ids.length });
});
