import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { LanguageProvider } from "@/components/providers";

/* Self-hosted Fontshare fonts (see scripts/download-fonts.sh to refresh).
   Modern-minimalist type system — each role has its own voice so the page
   feels designed, not templated:

   - Switzer       → body / UI  (warm humanist grotesque; replaces General Sans)
   - Tanker        → HERO      (single-weight wide geometric signature)
   - Cabinet Grotesk → display  (workhorse for marquees, card titles, nav)
   - Comico        → marquee   (playful handwriting/comic display strip)
   - Bevellier     → section H2s + WhatIDo mega rows (display signature)
   - Zodiak Italic → editoral serif accent for hover-reveal labels */
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

const zodiak = localFont({
  src: [
    { path: "../../public/fonts/Zodiak-700i.woff2", weight: "700", style: "italic" },
  ],
  variable: "--font-zodiak",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aura Auvarose — Full Stack Developer",
  description:
    "Aura Auvarose — full stack developer & IT student based in Indonesia, building polished, high-performance web and mobile applications.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${switzer.variable} ${tanker.variable} ${cabinetGrotesk.variable} ${comico.variable} ${bevellier.variable} ${zodiak.variable} dark`}
      style={{ colorScheme: "dark" }}
    >
      <body className="antialiased">
        {/* Theme boot — apply persisted theme before hydration to avoid FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var dark=t==='light'?false:(t==='dark'?true:true);var r=document.documentElement;if(dark){r.classList.add('dark');r.style.colorScheme='dark';}else{r.classList.remove('dark');r.style.colorScheme='light';}}catch(e){}})();`,
          }}
        />
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
