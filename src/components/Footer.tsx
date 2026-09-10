"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { profile } from "@/lib/config";

export default function Footer() {
  const markRef = useRef<HTMLHeadingElement>(null);
  const reduceMotion = useReducedMotion();

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
        {/* Once-only entrance: the watermark rises from below the fold the
            first time the footer scrolls into view, then stays put. */}
        <motion.h1
          ref={markRef}
          initial={reduceMotion ? undefined : { y: 110, opacity: 0 }}
          whileInView={reduceMotion ? undefined : { y: 0, opacity: 1 }}
          viewport={{ once: true, margin: "0px 0px -8% 0px" }}
          transition={reduceMotion ? undefined : { duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="footer-mark footer-mark-color translate-x-[2%] whitespace-nowrap text-[30vw] font-black uppercase leading-none tracking-[0.02em] transition-colors duration-500 md:text-[17vw] lg:text-[19vw]"
          style={{ fontFamily: "var(--font-array)" }}
        >
          {profile.name.split(" ")[0]}
        </motion.h1>
      </div>
    </footer>
  );
}
