import { Header } from "@/components/Header";

export default function NotFound() {
  return (
    <main>
      <Header />
      <section className="mx-auto max-w-3xl px-4 py-10" dir="ltr">
        <div className="rounded-2xl border border-line bg-[rgb(var(--sheet))]/80 p-6 shadow-sm">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-accent">Not found</p>
          <h1 className="mt-2 font-sans text-2xl font-bold">The page you requested does not exist.</h1>
          <p className="mt-3 font-sans text-sm leading-6 text-muted">Check the URL or return to the home page to search for a book or passage.</p>
          <a href="/" className="mt-5 inline-block rounded-full bg-ink px-4 py-2 font-sans text-sm font-semibold text-paper">Go home</a>
        </div>
      </section>
    </main>
  );
}
