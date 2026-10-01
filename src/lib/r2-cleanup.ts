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
  if (!bare) return null;

  // Decode DULU, baru validasi: memeriksa bentuk ter-encode membuat
  // `%2e%2e%2f` lolos filter `..` lalu berubah jadi `../` setelah decode.
  let decoded: string;
  try {
    decoded = decodeURIComponent(bare);
  } catch {
    return null;
  }

  if (!decoded || decoded.includes("..")) return null;

  // Key ini dipakai untuk MENGHAPUS objek, jadi hanya bentuk yang memang
  // dihasilkan `createPresignedUpload` yang diterima. Segmen kosong menutup
  // awalan "/", garis miring ganda, dan garis miring di ujung; spasi serta
  // karakter kontrol ditolak terpisah. Menolak key yang sebenarnya sah itu
  // murah, menghapus objek yang salah tidak bisa dibatalkan.
  if (decoded.split("/").some((segment) => segment === "")) return null;
  if (/[\s\u0000-\u001f\u007f]/.test(decoded)) return null;

  return decoded;
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
