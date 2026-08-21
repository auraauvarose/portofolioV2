"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import { useLanguage } from "@/components/providers";
import { contact, profile } from "@/lib/config";

function useLocalTime() {
  const [time, setTime] = useState("--:--");
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Jakarta",
      }).format(now);
      setTime(formatted);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export default function Contact() {
  const { t } = useLanguage();
  const time = useLocalTime();

  return (
    <section id="contact" className="relative overflow-hidden px-6 py-16 md:px-10 md:py-32">
      <div className="relative mx-auto max-w-7xl">
        <Reveal className="mb-10 flex items-center gap-4 text-sm uppercase tracking-widest text-gray-400">
          <span className="font-display text-accent">10</span>
          <span>{t(contact.kicker)}</span>
          <span className="h-px flex-1 bg-white/10" />
        </Reveal>

        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#22c55e]/30 bg-[#22c55e]/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-[#22c55e]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22c55e] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22c55e]" />
          </span>
          {t(contact.available)}
        </div>

        <h2 className="text-display uppercase leading-[0.86]">
          <span className="block text-[clamp(3rem,12vw,9rem)]">{t(contact.line1)}</span>
          <span className="block text-[clamp(3rem,12vw,9rem)] text-outline">{t(contact.line2)}</span>
          <span className="block text-[clamp(3rem,12vw,9rem)] text-accent">
            {t(contact.line3)}
          </span>
        </h2>

        <div className="mt-16 grid gap-8 md:grid-cols-4">
          <Reveal>
            <p className="mb-2 text-xs uppercase tracking-widest text-gray-500">
              {t(contact.emailLabel)}
            </p>
            <a
              href={`mailto:${profile.email}`}
              className="break-all text-lg font-medium text-white transition-colors hover:text-accent"
            >
              {profile.email}
            </a>
          </Reveal>
          <Reveal delay={80}>
            <p className="mb-2 text-xs uppercase tracking-widest text-gray-500">
              {t(contact.locationLabel)}
            </p>
            <p className="text-lg text-white">{t(profile.location)}</p>
          </Reveal>
          <Reveal delay={160}>
            <p className="mb-2 text-xs uppercase tracking-widest text-gray-500">
              {t(contact.timeLabel)}
            </p>
            <p className="text-lg text-white">
              {time} <span className="text-gray-500">{contact.timezone}</span>
            </p>
          </Reveal>
          <Reveal delay={240}>
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
    </section>
  );
}
