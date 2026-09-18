"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// ============================================================================
// Analytics ringan — tanpa cookie, tanpa PII, tanpa pihak ketiga.
//
// Mengirim satu POST per pageview ke /api/analytics dengan:
//   path      — halaman yang dilihat
//   referrer  — hanya HOSTNAME (bukan URL penuh, jadi tidak ada query pribadi)
//
// Yang TIDAK dikumpulkan: IP mentah (di-hash server-side), user agent penuh,
// cookie, ID pelacak, atau apa pun yang mengidentifikasi orang.
//
// Nonaktif bila NEXT_PUBLIC_ANALYTICS_ENABLED bukan "true", dan otomatis
// menghormati Do Not Track.
// ============================================================================

const ENABLED = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true";

/** Hostname referrer saja — buang path & query agar tidak membocorkan apa pun. */
function referrerHost(): string | null {
  try {
    if (!document.referrer) return null;
    const url = new URL(document.referrer);
    // Trafik internal tidak menarik untuk dihitung.
    if (url.hostname === window.location.hostname) return null;
    return url.hostname.slice(0, 120);
  } catch {
    return null;
  }
}

function dntEnabled(): boolean {
  const nav = navigator as Navigator & { msDoNotTrack?: string };
  return (
    nav.doNotTrack === "1" ||
    nav.msDoNotTrack === "1" ||
    (window as unknown as { doNotTrack?: string }).doNotTrack === "1"
  );
}

export default function Analytics() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  // Tunggu satu tick supaya komponen ini tidak memblokir render pertama.
  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ENABLED || !ready || !pathname) return;
    if (dntEnabled()) return;

    // Halaman admin tidak dihitung.
    if (pathname.startsWith("/admin")) return;

    const payload = JSON.stringify({
      path: pathname.slice(0, 200),
      referrer: referrerHost(),
    });

    // sendBeacon bertahan saat pengguna pindah/ menutup halaman, dan tidak
    // menahan unload seperti fetch biasa.
    const sent = navigator.sendBeacon?.(
      "/api/analytics",
      new Blob([payload], { type: "application/json" }),
    );

    if (!sent) {
      void fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  }, [pathname, ready]);

  return null;
}
