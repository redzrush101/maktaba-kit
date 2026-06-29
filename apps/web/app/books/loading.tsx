import { Header } from "@/components/Header";

export default function Loading() {
  return (
    <main>
      <Header />
      <section className="mx-auto max-w-4xl px-4 pb-8" dir="ltr">
        <div className="mb-4 h-16 animate-pulse rounded-xl border border-line bg-paper/70" />
        <div className="mb-4 h-8 w-24 animate-pulse rounded bg-line" />
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl border border-line bg-paper/70" />
          ))}
        </div>
      </section>
    </main>
  );
}
