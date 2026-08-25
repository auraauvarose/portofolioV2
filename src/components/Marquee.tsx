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
        <span
          className="text-comico text-5xl uppercase text-outline md:text-8xl"
          style={{ lineHeight: 1 }}
        >
          {label}
        </span>
        <span
          className="inline-flex shrink-0 translate-y-[-0.09em] items-center justify-center text-5xl md:text-8xl"
          style={{ lineHeight: 1 }}
        >
          <span className="text-3xl leading-none text-accent md:text-5xl ">
            
          </span>
        </span>
      </span>
    ));

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
