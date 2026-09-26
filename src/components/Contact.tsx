"use client";

import { useEffect, useRef, useState } from "react";
import Reveal from "@/components/Reveal";
import Magnetic from "@/components/Magnetic";
import ContactForm from "@/components/ContactForm";
import { useLanguage } from "@/components/providers";
import { contact, commentsPage } from "@/lib/config";
import { useSiteContent } from "@/components/site-content-provider";

function useLocalTime() {
  const [time, setTime] = useState("--:--");
  useEffect(() => {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta",
    });
    let previous = "";
    const update = () => {
      const formatted = formatter.format(new Date());
      if (formatted !== previous) {
        previous = formatted;
        setTime(formatted);
      }
    };
    update();
    let id: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const delay = 60_000 - (Date.now() % 60_000) + 50;
      id = setTimeout(() => {
        if (!document.hidden) update();
        schedule();
      }, delay);
    };
    schedule();
    const onVisible = () => {
      if (!document.hidden) update();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return time;
}

export default function Contact() {
  const { t } = useLanguage();
  const { profile } = useSiteContent();
  const time = useLocalTime();
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => el.classList.toggle("cycle-halt", !entry?.isIntersecting),
      { rootMargin: "160px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section id="contact" ref={sectionRef} className="relative overflow-hidden px-6 py-16 md:px-10 md:py-32">
      <div className="relative mx-auto max-w-7xl">
        <Reveal variant="left" className="mb-10 flex items-center gap-4 text-sm uppercase tracking-widest text-gray-400">
          <span className="font-display text-accent">07</span>
          <span>{t(contact.kicker)}</span>
          <span className="h-px flex-1 bg-white/10" />
        </Reveal>

        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#22c55e]/30 bg-[#22c55e]/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-[#22c55e] animate-color-cycle-ink">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75 [animation:ping-soft_1.6s_ease-out_infinite,color-cycle_8s_linear_infinite]" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22c55e] animate-color-cycle" />
          </span>
          {t(contact.available)}
        </div>

        <Reveal className="mt-2">
          <h2
            aria-label={[contact.line1, contact.line2, contact.line3]
              .map((l) => t(l))
              .join(" ")}
            className="text-display uppercase leading-[0.86]"
          >
            {[contact.line1, contact.line2, contact.line3].map((line, i) => (
              <span key={i} aria-hidden="true" className="block overflow-hidden">
                <span
                  className={`block text-[clamp(3rem,12vw,9rem)] ${i === 1 ? "text-outline" : ""} ${i === 2 ? "text-accent" : ""}`}
                  style={{
                    transform: "translateY(115%)",
                    transition: "transform 0.95s cubic-bezier(0.16, 1, 0.3, 1)",
                    transitionDelay: `${160 + i * 130}ms`,
                  }}
                  data-contact-line
                >
                  {t(line)}
                </span>
              </span>
            ))}
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <Reveal variant="left">
            <div className="border border-white/10 bg-white/[0.015] p-6 sm:p-8">
              <ContactForm />
            </div>
          </Reveal>

          <div className="grid gap-8 sm:grid-cols-2 lg:content-start">
            <Reveal variant="right" className="sm:col-span-2">
              <p className="mb-2 text-xs uppercase tracking-widest text-gray-500">
                {t(contact.emailLabel)}
              </p>
              <a
                href={`mailto:${profile.email}`}
                className="break-words text-base font-medium text-white transition-colors hover:text-accent sm:text-lg"
              >
                {profile.email}
              </a>
              <div className="mt-4">
                <Magnetic strength={0.25}>
                  <a
                    href="/komentar"
                    className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full border border-accent/40 bg-accent/10 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-accent transition-all duration-300 hover:bg-accent hover:text-black"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-transform duration-300 group-hover:scale-110"
                      aria-hidden="true"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    {t(commentsPage.cta)}
                  </a>
                </Magnetic>
              </div>
            </Reveal>
            <Reveal delay={80} variant="right">
              <p className="mb-2 text-xs uppercase tracking-widest text-gray-500">
                {t(contact.locationLabel)}
              </p>
              <p className="text-lg text-white">{t(profile.location)}</p>
            </Reveal>
            <Reveal delay={160} variant="right">
              <p className="mb-2 text-xs uppercase tracking-widest text-gray-500">
                {t(contact.timeLabel)}
              </p>
              <p className="text-lg text-white">
                {time} <span className="text-gray-500">{contact.timezone}</span>
              </p>
            </Reveal>
            <Reveal delay={240} variant="right">
              <p className="mb-2 text-xs uppercase tracking-widest text-gray-500">
                {t(contact.socialsLabel)}
              </p>
              <div className="flex flex-col gap-2">
                {profile.socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative inline-block overflow-hidden text-lg text-white transition-colors hover:text-accent"
                  >
                    <span className="inline-block transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:-translate-y-[110%]">
                      {s.label}
                    </span>
                    <span className="absolute left-0 top-0 inline-block translate-y-[110%] text-serif-accent text-accent transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-y-0">
                      {s.label}
                    </span>
                  </a>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
