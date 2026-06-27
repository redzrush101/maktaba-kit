export default function Loading() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10" dir="ltr">
      <div className="rounded-2xl border border-line bg-[rgb(var(--sheet))]/70 p-5 shadow-sm">
        <div className="h-4 w-32 animate-pulse rounded bg-line" />
        <div className="mt-5 h-8 w-2/3 animate-pulse rounded bg-line" />
        <div className="mt-4 space-y-2">
          <div className="h-3 animate-pulse rounded bg-line/70" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-line/70" />
        </div>
      </div>
    </main>
  );
}
