import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { LanguageProvider } from "@/components/providers";

/* Self-hosted Fontshare fonts (see scripts/download-fonts.sh to refresh).
   - General Sans: warm premium neo-grotesque body/UI font (replaces Inter)
   - Cabinet Grotesk: heavy bold/black display font (replaces Anton) */
const generalSans = localFont({
  src: [
    { path: "../../public/fonts/GeneralSans-400.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/GeneralSans-500.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/GeneralSans-600.woff2", weight: "600", style: "normal" },
    { path: "../../public/fonts/GeneralSans-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-general",
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
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <body
        className={`${generalSans.variable} ${cabinetGrotesk.variable} antialiased`}
      >
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
