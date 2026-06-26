import { createMaktabaClient, type SourceSelect } from "@maktaba-kit/core";
import { Header } from "@/components/Header";
import { SearchBox } from "@/components/SearchBox";
import { SourceBadge } from "@/components/SourceBadge";
import Link from "next/link";

export default async function BooksPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const q = params.q ?? "";
  const source = (params.source ?? "all") as SourceSelect;
  const res = q ? await createMaktabaClient({ timeoutMs: 18_000 }).books(q, { source, limit: 16 }) : { data: [], errors: [], ok: true };
  return (
    <main>
      <Header />
      <section className="mx-auto max-w-4xl px-4 pb-8">
        <div className="mb-4 rounded-xl border border-line bg-paper/70 p-2 shadow-sm">
          <SearchBox defaultValue={q} action="/books" placeholder="ابحث عن كتاب أو مؤلف..." defaultSource={source} />
        </div>
        <h1 className="mb-4 font-arabic text-2xl font-semibold">الكتب</h1>
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {res.data.map((book) => {
            const href = `/books/${book.source}/${book.id}${book.source === "eshia" && book.volume ? `?volume=${book.volume}` : ""}`;
            return (
              <Link key={`${book.source}-${book.id}`} href={href} className="rounded-xl border border-line bg-paper/75 p-3 shadow-sm transition hover:shadow-soft">
                <SourceBadge source={book.source} />
                <h2 className="mt-2 font-arabic text-lg font-semibold">{book.title || book.id}</h2>
                {book.author && <p className="mt-2 font-arabic text-muted">{book.author}</p>}
                {book.pages && <p className="mt-3 font-sans text-xs text-muted" dir="ltr">{book.pages} pages</p>}
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
