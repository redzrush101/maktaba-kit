import { Header } from "@/components/Header";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main>
      <Header />
      <section className="mx-auto max-w-3xl px-4 py-10" dir="ltr">
        <div className="rounded-2xl border border-line bg-[rgb(var(--sheet))]/80 p-6 shadow-sm">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-accent">Something went wrong</p>
          <h1 className="mt-2 font-sans text-2xl font-bold">The library page could not be loaded.</h1>
          <p className="mt-3 font-sans text-sm leading-6 text-muted">{error.message}</p>
          <button type="button" onClick={reset} className="mt-5 rounded-full bg-ink px-4 py-2 font-sans text-sm font-semibold text-paper">Try again</button>
        </div>
      </section>
    </main>
  );
}
