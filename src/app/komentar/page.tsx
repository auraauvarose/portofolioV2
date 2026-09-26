import type { Metadata } from "next";
import CommentsClient from "@/components/CommentsClient";
import { getComments } from "@/lib/data";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Komentar",
  description:
    "Tinggalkan komentar, sapaan, atau jejak kunjunganmu di halaman buku tamu Aura Auvarose.",
};

export default async function CommentsPage() {
  const comments = await getComments();
  return <CommentsClient initial={comments} />;
}
