import { type SourceSelect } from "@maktaba-kit/core";
import { maktabaClient } from "@/lib/maktaba-client";
import { BookCard } from "@/components/BookCard";
import { Header } from "@/components/Header";
import { SearchBox } from "@/components/SearchBox";

export default async function BooksPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const q = params.q ?? "";
  const source = (params.source ?? "all") as SourceSelect;
  const res = q ? await maktabaClient.books(q, { source, limit: 16 }) : { data: [], errors: [], ok: true };
  return (
    <main>
      <Header />
      <section className="mx-auto max-w-4xl px-4 pb-8">
        <div className="mb-4 rounded-xl border border-line bg-paper/70 p-2 shadow-sm">
          <SearchBox defaultValue={q} action="/search" placeholder="Search books or authors..." defaultSource={source} defaultMode="books" />
        </div>
        <h1 className="mb-4 font-sans text-2xl font-semibold">Books</h1>
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {res.data.map((book) => <BookCard key={`${book.source}-${book.id}`} book={book} />)}
        </div>
      </section>
    </main>
  );
}
