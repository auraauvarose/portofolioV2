export default function Loading() {
  return (
    <main
      aria-busy="true"
      className="relative min-h-[100dvh] overflow-x-clip bg-ink"
    >
      <div aria-hidden="true" className="animate-pulse">
        <div className="flex items-center justify-between px-6 py-5 md:px-10">
          <div className="h-9 w-9 rounded-md bg-panel" />
          <div className="hidden items-center gap-7 md:flex">
            <div className="h-3 w-14 rounded-full bg-panel" />
            <div className="h-3 w-16 rounded-full bg-panel" />
            <div className="h-3 w-12 rounded-full bg-panel" />
            <div className="h-3 w-20 rounded-full bg-panel" />
          </div>
        </div>

        <div className="mx-auto w-full max-w-7xl px-6 pt-14 md:px-10 md:pt-24">
          <div className="h-3 w-36 rounded-full bg-panel" />
          <div className="mt-7 h-12 w-full max-w-2xl rounded-md bg-panel md:h-16" />
          <div className="mt-4 h-12 w-full max-w-xl rounded-md bg-panel md:h-16" />
          <div className="mt-8 h-4 w-full max-w-md rounded-full bg-panel" />
          <div className="mt-3 h-4 w-full max-w-sm rounded-full bg-panel" />
          <div className="mt-10 flex flex-wrap gap-3">
            <div className="h-11 w-36 rounded-md bg-panel" />
            <div className="h-11 w-32 rounded-md bg-panel" />
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-7xl gap-5 px-6 pt-20 pb-24 md:grid-cols-3 md:px-10 md:pt-28">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="h-40 rounded-lg border border-white/10 bg-panel"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
