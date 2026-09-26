"use client";

export default function FileThumb({ url }: { url: string | null }) {
  const isPdf = url
    ? (() => {
        const q = url.split("?")[0].toLowerCase();
        return (
          q.endsWith(".pdf") || url.toLowerCase().startsWith("data:application/pdf")
        );
      })()
    : false;

  return (
    <div className="h-11 w-16 shrink-0 overflow-hidden rounded-md border border-[var(--color-a-line)] bg-[var(--color-a-surface-2)]">
      {url ? (
        isPdf ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex h-full w-full items-center justify-center text-[var(--color-a-accent)] transition-colors hover:bg-[var(--color-a-surface)]"
            title="Buka PDF"
            aria-label="Buka PDF"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M12 18v-6" />
              <path d="M9 15h6" />
            </svg>
          </a>
        ) : (
          <img src={url} alt="" className="h-full w-full object-cover" />
        )
      ) : (
        <span
          aria-hidden="true"
          className="flex h-full w-full items-center justify-center"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-a-faint)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="m3.5 18 5-5 4 4 3.5-3.5 5 5" />
          </svg>
        </span>
      )}
    </div>
  );
}
