"use client";

export default function Marquee({
  label,
  reverse = false,
}: {
  label: string;
  reverse?: boolean;
}) {
  const copy = (keyPrefix: string) =>
    Array.from({ length: 4 }, (_, i) => (
      <span
        key={`${keyPrefix}-${i}`}
        className="flex items-center gap-8 whitespace-nowrap"
      >
        <span className="text-display text-5xl uppercase text-outline md:text-8xl">
          {label}
        </span>
        <span className="text-3xl text-accent md:text-5xl">✦</span>
      </span>
    ));

  // ponytail: relative z-[1] — positioned hero wrapper (z-0) paints above non-positioned
  // elements, so without this the pinned hero shows THROUGH the marquee strip.
  return (
    <div className="marquee-mask relative z-[1] overflow-hidden border-y border-white/5 bg-ink py-6">
      <div
        className={`flex w-max ${
          reverse ? "animate-marquee-reverse" : "animate-marquee"
        }`}
      >
        {copy("a")}
        {copy("b")}
      </div>
    </div>
  );
}
