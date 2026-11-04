import type { Metadata } from "next";
import CertificateRequestClient from "@/components/CertificateRequestClient";
import { SITE_NAME, absoluteUrl } from "@/lib/site";

const title = "Izin lihat sertifikat";
const description =
  "Minta izin untuk melihat foto sertifikat Aurose. Sertifikat memuat nama lengkap pemilik, jadi fotonya dikunci.";

export const metadata: Metadata = {
  title,
  description,
  robots: { index: false, follow: false },
  alternates: { canonical: absoluteUrl("/izin-sertifikat") },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["id_ID"],
    url: absoluteUrl("/izin-sertifikat"),
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

export default function IzinSertifikatPage() {
  return <CertificateRequestClient />;
}
