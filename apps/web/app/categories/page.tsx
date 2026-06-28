import { Header } from "@/components/Header";
import { maktabaClient } from "@/lib/maktaba-client";
import Link from "next/link";

export default async function CategoriesPage() {
  const res = await maktabaClient.categories();

  return (
    <main>
      <Header />
      <section className="mx-auto max-w-5xl px-4 pb-10" dir="ltr">
        <div className="mb-5">
          <p className="font-sans text-sm text-muted">ABLibrary browsing</p>
          <h1 className="font-sans text-3xl font-bold">Categories</h1>
        </div>
        {!!res.errors.length && <p className="mb-4 rounded-2xl border border-line p-4 font-sans text-sm text-muted">{res.errors.map((e) => e.message).join("; ")}</p>}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" dir="rtl">
          {res.data.map((category) => (
            <Link key={category.id} href={`/categories/${category.id}`} className="rounded-2xl border border-line bg-[rgb(var(--sheet))]/70 p-4 font-arabic text-lg font-semibold text-ink shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
              {category.name}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
