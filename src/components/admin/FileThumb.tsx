"use client";

/**
 * Small thumbnail for admin list rows: shows the image preview, or a PDF badge
 * for PDF files, and nothing (empty box) when there is no file yet.
 */
export default function FileThumb({ url }: { url: string | null }) {
  const isPdf = url
    ? (() => {
        const q = url.split("?")[0].toLowerCase();
        return q.endsWith(".pdf") || url.toLowerCase().startsWith("data:application/pdf");
      })()
    : false;

  return (
    <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-black/40">
      {url ? (
        isPdf ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex h-full w-full items-center justify-center text-accent hover:bg-white/5"
            title="Open PDF"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M12 18v-6" />
              <path d="M9 15h6" />
            </svg>
          </a>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-full w-full object-cover" />
        )
      ) : null}
    </div>
  );
}
