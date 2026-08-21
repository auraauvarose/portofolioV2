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
        {/* Star, vertically centred on the display text:
            the star's outer box is given the SAME font-size as the text so the
            translate offset below is expressed in the TEXT's em (not the star's
            smaller em). With `items-center` both boxes are centred, and the
            small correction accounts for the display font's glyphs sitting
            visually high in their em box (Anton-style tall ascenders). */}
        <span
          className="inline-flex shrink-0 translate-y-[-0.09em] items-center justify-center text-5xl md:text-8xl"
          style={{ lineHeight: 1 }}
        >
          <span className="text-3xl leading-none text-accent md:text-5xl ">
            
          </span>
        </span>
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
