"use client";

import { useEffect } from "react";
import Link from "next/link";
import { errorPage } from "@/lib/config";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-ink px-6 text-center text-ecru">
      <p className="text-[10px] uppercase tracking-[0.28em] text-accent">
        {errorPage.kicker.en} / {errorPage.kicker.id}
      </p>

      <h1 className="text-display mt-6 text-5xl uppercase leading-[0.92] text-white sm:text-7xl">
        {errorPage.heading.en}
        <span className="text-accent">.</span>
      </h1>

      <p className="mt-5 max-w-md text-sm leading-relaxed text-gray-400">
        {errorPage.body.en}
      </p>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-gray-600">
        {errorPage.body.id}
      </p>

      {error.digest && (
        <p className="mt-4 font-mono text-[11px] text-gray-700">
          ref: {error.digest}
        </p>
      )}

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-md bg-accent px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-black transition-colors duration-300 hover:bg-accent-soft active:scale-[0.98]"
        >
          {errorPage.retry.en}
        </button>
        <Link
          href="/"
          className="rounded-md border border-white/20 px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors duration-300 hover:border-accent hover:text-accent active:scale-[0.98]"
        >
          {errorPage.home.en}
        </Link>
      </div>
    </main>
  );
}
