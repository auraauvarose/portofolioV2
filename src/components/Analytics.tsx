"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const ENABLED = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true";

function referrerHost(): string | null {
  try {
    if (!document.referrer) return null;
    const url = new URL(document.referrer);
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

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ENABLED || !ready || !pathname) return;
    if (dntEnabled()) return;

    if (pathname.startsWith("/admin")) return;

    const payload = JSON.stringify({
      path: pathname.slice(0, 200),
      referrer: referrerHost(),
    });

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
