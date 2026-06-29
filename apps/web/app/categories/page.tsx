import { Header } from "@/components/Header";
import { maktabaClient } from "@/lib/maktaba-client";
import Link from "next/link";

export default async function CategoriesPage() {
  const res = await maktabaClient().categories();
  const categoryGroups = chunk(res.data, 12);

  return (
    <main>
      <Header />
      <section className="mx-auto max-w-5xl px-4 pb-10" dir="ltr">
        <div className="mb-5">
          <p className="font-sans text-sm text-muted">ABLibrary browsing</p>
          <h1 className="font-sans text-3xl font-bold">Categories</h1>
        </div>
        {!!res.errors.length && <p className="mb-4 rounded-2xl border border-line p-4 font-sans text-sm text-muted">{res.errors.map((e) => e.message).join("; ")}</p>}
        <div className="space-y-2 md:hidden" dir="rtl">
          {categoryGroups.map((group, index) => (
            <details key={`group-${index}`} open={index === 0} className="rounded-2xl border border-line bg-[rgb(var(--sheet))]/70 p-2 shadow-sm">
              <summary className="cursor-pointer rounded-xl px-3 py-3 font-sans text-sm font-semibold text-ink" dir="ltr">
                Categories {index * 12 + 1}–{index * 12 + group.length}
              </summary>
              <div className="mt-1 grid gap-2">
                {group.map((category) => (
                  <Link key={category.id} href={`/categories/${category.id}`} className="min-h-12 rounded-xl border border-line/70 bg-paper/40 px-4 py-3 font-arabic text-lg font-semibold text-ink">
                    {category.name}
                  </Link>
                ))}
              </div>
            </details>
          ))}
        </div>
        <div className="hidden gap-2 md:grid md:grid-cols-2 lg:grid-cols-3" dir="rtl">
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

function chunk<T>(items: T[], size: number) {
  const groups: T[][] = [];
  for (let index = 0; index < items.length; index += size) groups.push(items.slice(index, index + size));
  return groups;
}
