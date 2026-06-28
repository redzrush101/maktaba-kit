import { Header } from "@/components/Header";

export default function Loading() {
  return (
    <main>
      <Header />
      <section className="reader-shell mx-auto grid gap-3 px-4 pb-36 lg:grid-cols-[14rem_1fr] lg:pb-10" dir="ltr">
        <aside className="hidden space-y-2 lg:block">
          <div className="h-72 animate-pulse rounded-xl border border-line bg-[rgb(var(--sheet))]/60" />
        </aside>
        <article className="book-sheet rounded-2xl border border-line p-5 sm:p-7 lg:p-8">
          <div className="h-6 w-40 animate-pulse rounded bg-line/60" />
          <div className="mt-5 h-8 w-2/3 animate-pulse rounded bg-line/60" />
          <div className="mt-8 space-y-3">
            {Array.from({ length: 9 }).map((_, index) => <div key={index} className="h-5 animate-pulse rounded bg-line/50" />)}
          </div>
        </article>
      </section>
    </main>
  );
}
