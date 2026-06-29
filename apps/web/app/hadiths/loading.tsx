import { Header } from "@/components/Header";

export default function Loading() {
  return (
    <main>
      <Header />
      <section className="mx-auto max-w-6xl px-4 pb-14 pt-4" dir="ltr">
        <div className="h-96 animate-pulse rounded-[2rem] border border-line bg-[rgb(var(--sheet))]/60" />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl border border-line bg-paper/60" />
          ))}
        </div>
      </section>
    </main>
  );
}
