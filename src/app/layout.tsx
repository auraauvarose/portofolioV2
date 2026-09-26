import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { LanguageProvider } from "@/components/providers";
import { SiteContentProvider } from "@/components/site-content-provider";
import { getSiteContent } from "@/lib/site-content";
import Analytics from "@/components/Analytics";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  absoluteUrl,
  siteUrl,
} from "@/lib/site";

const switzer = localFont({
  src: [
    { path: "../../public/fonts/Switzer-400.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/Switzer-500.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/Switzer-600.woff2", weight: "600", style: "normal" },
    { path: "../../public/fonts/Switzer-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-switzer",
  display: "swap",
});

const tanker = localFont({
  src: [{ path: "../../public/fonts/Tanker-Regular.woff2", weight: "400", style: "normal" }],
  variable: "--font-tanker",
  display: "swap",
});

const cabinetGrotesk = localFont({
  src: [
    { path: "../../public/fonts/CabinetGrotesk-400.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/CabinetGrotesk-500.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/CabinetGrotesk-700.woff2", weight: "700", style: "normal" },
    { path: "../../public/fonts/CabinetGrotesk-800.woff2", weight: "800", style: "normal" },
    { path: "../../public/fonts/CabinetGrotesk-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-cabinet",
  display: "swap",
});

const comico = localFont({
  src: [
    { path: "../../public/fonts/Comico-Regular.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-comico",
  display: "swap",
});

const bevellier = localFont({
  src: [
    { path: "../../public/fonts/Bevellier-600.woff2", weight: "600", style: "normal" },
    { path: "../../public/fonts/Bevellier-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-bevellier",
  display: "swap",
});

const chillax = localFont({
  src: [
    { path: "../../public/fonts/Chillax-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-chillax",
  display: "swap",
});

const zodiak = localFont({
  src: [
    { path: "../../public/fonts/Zodiak-700i.woff2", weight: "700", style: "italic" },
  ],
  variable: "--font-zodiak",
  display: "swap",
});

const array = localFont({
  src: [
    { path: "../../public/fonts/Array-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-array",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: absoluteUrl("/") }],
  creator: SITE_NAME,
  keywords: [
    "Aura Auvarose",
    "full stack developer",
    "web developer Indonesia",
    "React developer",
    "Next.js developer",
    "freelance developer",
  ],
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["id_ID"],
    url: absoluteUrl("/"),
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — Full Stack Developer`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0d0e13" },
    { media: "(prefers-color-scheme: light)", color: "#f4f4f5" },
  ],
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: SITE_NAME,
  url: absoluteUrl("/"),
  image: absoluteUrl("/profile.webp"),
  jobTitle: "Full Stack Developer",
  description: SITE_DESCRIPTION,
  email: "mailto:auraauvaroseendica@gmail.com",
  address: {
    "@type": "PostalAddress",
    addressCountry: "ID",
  },
  sameAs: [
    "https://github.com/auraauvarose",
    "https://www.instagram.com/aura_auvarose_/",
    "https://www.tiktok.com/@au.rose",
  ],
  knowsAbout: [
    "Web Development",
    "React",
    "Next.js",
    "TypeScript",
    "PostgreSQL",
    "Linux",
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteContent = await getSiteContent();

  return (
    <html
      lang="en"
      className={`${switzer.variable} ${tanker.variable} ${cabinetGrotesk.variable} ${comico.variable} ${bevellier.variable} ${chillax.variable} ${zodiak.variable} ${array.variable} dark`}
      style={{ colorScheme: "dark" }}
    >
      <body className="antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var dark=t==='light'?false:(t==='dark'?true:true);var r=document.documentElement;if(dark){r.classList.add('dark');r.style.colorScheme='dark';}else{r.classList.remove('dark');r.style.colorScheme='light';}}catch(e){}})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        <SiteContentProvider value={siteContent}>
          <LanguageProvider>
            {children}
            <Analytics />
          </LanguageProvider>
        </SiteContentProvider>
      </body>
    </html>
  );
}
