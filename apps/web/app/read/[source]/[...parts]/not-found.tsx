import { Header } from "@/components/Header";

export default function ReaderNotFound() {
  return (
    <main>
      <Header />
      <section className="mx-auto max-w-3xl px-4 py-10" dir="ltr">
        <div className="rounded-2xl border border-line bg-[rgb(var(--sheet))]/80 p-6 shadow-sm">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-accent">Page not found</p>
          <h1 className="mt-2 font-sans text-2xl font-bold">This reader page could not be found.</h1>
          <p className="mt-3 font-sans text-sm leading-6 text-muted">The book, volume, or page reference may be incorrect. Try searching for the book by title.</p>
          <a href="/search" className="mt-5 inline-block rounded-full bg-ink px-4 py-2 font-sans text-sm font-semibold text-paper">Search books</a>
        </div>
      </section>
    </main>
  );
}
