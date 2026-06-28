import { Header } from "@/components/Header";

export default function Loading() {
  return (
    <main>
      <Header hideSearch />
      <section className="mx-auto w-full max-w-5xl px-4 pb-8" dir="ltr">
        <div className="h-28 animate-pulse rounded-2xl border border-line bg-[rgb(var(--sheet))]/60" />
        <div className="mt-6 grid gap-2 lg:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-40 animate-pulse rounded-xl border border-line bg-paper/60" />)}
        </div>
      </section>
    </main>
  );
}
