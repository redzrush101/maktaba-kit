import { Header } from "@/components/Header";
import { maktabaClient } from "@/lib/maktaba-client";
import { BookCard } from "@/components/BookCard";
import Link from "next/link";

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ categoryId: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { categoryId } = await params;
  const { page = "1" } = await searchParams;
  const pageNo = Math.max(1, Number(page));
  const [categoriesRes, booksRes] = await Promise.all([
    maktabaClient.categories(),
    maktabaClient.categoryBooks(categoryId, { limit: 48, page: pageNo }),
  ]);
  const category = categoriesRes.data.find((item) => item.id === categoryId);

  return (
    <main>
      <Header />
      <section className="mx-auto max-w-5xl px-4 pb-10" dir="ltr">
        <div className="mb-5">
          <Link href="/categories" className="font-sans text-sm text-muted hover:text-ink">← All categories</Link>
          <h1 className="mt-2 font-arabic text-3xl font-bold" dir="rtl">{category?.name ?? `Category ${categoryId}`}</h1>
          <p className="mt-1 font-sans text-sm text-muted">ABLibrary books · page {pageNo}</p>
        </div>
        {!!booksRes.errors.length && <p className="mb-4 rounded-2xl border border-line p-4 font-sans text-sm text-muted">{booksRes.errors.map((e) => e.message).join("; ")}</p>}
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {booksRes.data.map((book, i) => <BookCard key={`${book.source}-${book.id}-${i}`} book={book} />)}
        </div>
        <nav className="mt-5 flex items-center justify-center gap-2 font-sans text-sm" aria-label="Category pagination">
          <Link aria-disabled={pageNo <= 1} className="rounded-full border border-line px-4 py-2 text-ink aria-disabled:pointer-events-none aria-disabled:opacity-40" href={`/categories/${categoryId}?page=${Math.max(1, pageNo - 1)}`}>Previous</Link>
          <span className="text-muted">Page {pageNo}</span>
          <Link aria-disabled={booksRes.data.length < 48} className="rounded-full bg-ink px-4 py-2 text-paper aria-disabled:pointer-events-none aria-disabled:opacity-40" href={`/categories/${categoryId}?page=${pageNo + 1}`}>Next</Link>
        </nav>
      </section>
    </main>
  );
}
