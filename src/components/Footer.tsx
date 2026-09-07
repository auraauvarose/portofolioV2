"use client";

import { useEffect, useRef } from "react";
import { profile } from "@/lib/config";

export default function Footer() {
  const markRef = useRef<HTMLHeadingElement>(null);

  // Pause the watermark gradient animation while it is offscreen. Nothing
  // visible changes, but the browser stops repainting a 30vw text layer
  // every frame while the user is somewhere else on the page.
  useEffect(() => {
    const el = markRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => el.classList.toggle("mark-halt", !entry?.isIntersecting),
      { rootMargin: "96px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <footer className="relative overflow-x-clip">
      <div className="pointer-events-none select-none overflow-x-clip -mt-8 md:-mt-16 lg:-mt-20">
    <h1 ref={markRef} className="footer-mark footer-mark-color translate-x-[2%] whitespace-nowrap text-[30vw] font-black uppercase leading-none tracking-[0.02em] transition-colors duration-500 md:text-[17vw] lg:text-[19vw]" style={{ fontFamily: "var(--font-array)" }}>
          {profile.name.split(" ")[0]}
        </h1>
      </div>
    </footer>
  );
}
