import { deleteR2Object } from "@/lib/r2";
import type { createSupabaseAdmin } from "@/lib/supabase/admin";

type SupabaseAdmin = Awaited<ReturnType<typeof createSupabaseAdmin>>;

export type ImageColumn =
  | { table: "projects"; column: "image_url" }
  | { table: "certifications"; column: "image_url" }
  | { table: "gallery_photos"; column: "image_url" };

export function keyFromPublicUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (!base) return null;

  const cleanBase = base.replace(/\/+$/, "");
  if (!url.startsWith(`${cleanBase}/`)) return null;

  const key = url.slice(cleanBase.length + 1);
  const bare = key.split("?")[0].split("#")[0];
  if (!bare || bare.includes("..")) return null;

  try {
    return decodeURIComponent(bare);
  } catch {
    return null;
  }
}

export async function deleteR2IfUnreferenced(
  supabase: SupabaseAdmin,
  { table, column }: ImageColumn,
  url: string | null | undefined,
): Promise<void> {
  const key = keyFromPublicUrl(url);
  if (!key) return;

  try {
    const { data, error } = await supabase
      .from(table)
      .select("id")
      .eq(column, url as string)
      .limit(1);

    if (error) {
      console.error(`r2 cleanup: gagal cek referensi ${table}.${column}:`, error.message);
      return;
    }
    if (data && data.length > 0) return;

    await deleteR2Object(key);
  } catch (err) {
    console.error("r2 cleanup: gagal menghapus objek:", err);
  }
}
