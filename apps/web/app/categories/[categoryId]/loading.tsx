export default function CategoryLoading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10" dir="ltr">
      <div className="mb-5">
        <div className="h-4 w-24 animate-pulse rounded bg-line" />
        <div className="mt-3 h-8 w-1/2 animate-pulse rounded bg-line" />
        <div className="mt-2 h-3 w-40 animate-pulse rounded bg-line/70" />
      </div>
      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-line bg-paper/70 p-3">
            <div className="h-3 w-16 animate-pulse rounded bg-line" />
            <div className="mt-3 h-5 w-3/4 animate-pulse rounded bg-line/70" />
            <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-line/70" />
          </div>
        ))}
      </div>
    </main>
  );
}
