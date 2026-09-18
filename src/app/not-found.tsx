import Link from "next/link";
import { notFoundPage } from "@/lib/config";

export const metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-ink px-6 text-center text-ecru">
      <p className="text-[10px] uppercase tracking-[0.28em] text-accent">
        {notFoundPage.kicker.en} / {notFoundPage.kicker.id}
      </p>

      <h1 className="text-display mt-6 text-5xl uppercase leading-[0.92] text-white sm:text-7xl">
        {notFoundPage.heading.en}
        <span className="text-accent">.</span>
      </h1>

      <p className="mt-5 max-w-md text-sm leading-relaxed text-gray-400">
        {notFoundPage.body.en}
      </p>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-gray-600">
        {notFoundPage.body.id}
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-md bg-accent px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-black transition-colors duration-300 hover:bg-accent-soft active:scale-[0.98]"
        >
          {notFoundPage.home.en}
        </Link>
        <Link
          href="/#work"
          className="rounded-md border border-white/20 px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors duration-300 hover:border-accent hover:text-accent active:scale-[0.98]"
        >
          {notFoundPage.work.en}
        </Link>
      </div>
    </main>
  );
}
