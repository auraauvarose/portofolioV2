import type { Metadata } from "next";
import CommentsClient from "@/components/CommentsClient";
import { getComments } from "@/lib/data";
import { SITE_NAME, absoluteUrl } from "@/lib/site";

export const revalidate = 120;

const title = "Komentar";
const description =
  "Tinggalkan komentar, sapaan, atau jejak kunjunganmu di halaman buku tamu Aura Auvarose.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: absoluteUrl("/komentar") },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["id_ID"],
    url: absoluteUrl("/komentar"),
    siteName: SITE_NAME,
    title,
    description,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: title }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.png"],
  },
};

export default async function CommentsPage() {
  const comments = await getComments();
  return <CommentsClient initial={comments} />;
}
