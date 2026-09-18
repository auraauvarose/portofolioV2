import type { Metadata } from "next";
import CommentsClient from "@/components/CommentsClient";
import { getComments } from "@/lib/data";

// Komentar baru masuk moderasi, jadi daftar publik jarang berubah.
// Admin memaksa segar lewat invalidate(CACHE_TAGS.comments).
export const revalidate = 120;

export const metadata: Metadata = {
  // Judul polos: template di layout.tsx menambahkan nama situs otomatis.
  title: "Komentar",
  description:
    "Tinggalkan komentar, sapaan, atau jejak kunjunganmu di halaman buku tamu Aura Auvarose.",
};

export default async function CommentsPage() {
  const comments = await getComments();
  return <CommentsClient initial={comments} />;
}
