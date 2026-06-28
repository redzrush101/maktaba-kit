import { Header } from "@/components/Header";

export default function Loading() {
  return (
    <main>
      <Header />
      <section className="mx-auto max-w-5xl px-4 pb-10" dir="ltr">
        <div className="h-64 animate-pulse rounded-2xl border border-line bg-[rgb(var(--sheet))]/60" />
        <div className="mt-4 h-48 animate-pulse rounded-2xl border border-line bg-paper/60" />
      </section>
    </main>
  );
}
