import { createMaktabaClient } from "@maktaba-kit/core";
import { Header } from "@/components/Header";
import { SearchBox } from "@/components/SearchBox";
import { SourceBadge } from "@/components/SourceBadge";
import Link from "next/link";

export default async function BookPage({ params, searchParams }: { params: Promise<{ source: string; bookId: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { source, bookId } = await params;
  const { volume = "1" } = await searchParams;
  const ref = source === "eshia" ? `eshia:${bookId}/${volume}/1` : `ablibrary:${bookId}/1`;
  const client = createMaktabaClient({ timeoutMs: 18_000 });
  const [infoRes, tocRes] = await Promise.all([client.info(ref), client.toc(ref, 120)]);
  const book = infoRes.data[0];
  const volumes = (Array.isArray(book?.meta?.volumes) ? book.meta.volumes : []) as Array<{ label: string; value: string }>;
  const categories = (Array.isArray(book?.meta?.categories) ? book.meta.categories : []) as Array<{ name?: string }>;
  const readHref = source === "eshia" ? `/read/eshia/${bookId}/${volume}/1` : `/read/ablibrary/${bookId}/1`;

  return (
    <main>
      <Header />
      <section className="mx-auto max-w-5xl px-4 pb-10" dir="ltr">
        <div className="rounded-2xl border border-line bg-[rgb(var(--sheet))]/80 p-5 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <SourceBadge source={source} />
            <span className="font-sans text-xs text-muted" dir="ltr">{ref}</span>
          </div>
          <h1 className="font-arabic text-3xl font-bold leading-tight" dir="rtl">{book?.title || "Book"}</h1>
          {book?.author && <p className="mt-2 font-arabic text-lg text-muted" dir="rtl">{book.author}</p>}
          <div className="mt-4 flex flex-wrap gap-2 font-sans text-xs text-muted" dir="ltr">
            {book?.pages && <span className="rounded-full border border-line px-3 py-1">{book.pages} pages</span>}
            {book?.volume && <span className="rounded-full border border-line px-3 py-1">volume {book.volume}</span>}
          </div>
          {!!categories.length && <div className="mt-4 flex flex-wrap gap-2 font-arabic text-sm text-muted" dir="rtl">{categories.map((category, i) => category.name ? <span key={`${category.name}-${i}`} className="rounded-full border border-line px-3 py-1">{category.name}</span> : null)}</div>}
          <div className="mt-5 flex flex-wrap gap-2 font-sans text-sm" dir="ltr">
            <Link href={readHref} className="rounded-full bg-ink px-4 py-2 font-semibold text-paper">Read</Link>
            {book?.url && <a href={book.url} target="_blank" className="rounded-full border border-line px-4 py-2 text-ink">Original</a>}
          </div>
        </div>

        {volumes.length > 0 && (
          <section className="mt-4 rounded-2xl border border-line bg-paper/60 p-4">
            <h2 className="mb-3 font-sans text-xl font-semibold">Volumes</h2>
            <div className="flex flex-wrap gap-2" dir="ltr">
              {volumes.map((v) => <Link key={v.value} href={`/books/${source}/${bookId}?volume=${v.value}`} className={`rounded-lg border border-line px-3 py-1.5 font-sans text-sm ${v.value === volume ? "bg-ink text-paper" : "text-ink"}`}>{v.label}</Link>)}
            </div>
          </section>
        )}

        <section className="mt-4 rounded-2xl border border-line bg-paper/60 p-4">
          <h2 className="mb-3 font-sans text-xl font-semibold">Search inside this book</h2>
          <SearchBox hiddenFields={{ bookId, volume: source === "eshia" ? volume : undefined }} defaultSource={source} placeholder="Search inside this book..." />
        </section>

        <section className="mt-4 rounded-2xl border border-line bg-paper/60 p-4">
          <h2 className="mb-3 font-sans text-xl font-semibold">Table of contents</h2>
          {tocRes.data.length ? (
            <div className="grid gap-2 md:grid-cols-2">
              {tocRes.data.map((item, i) => {
                const href = item.source === "eshia" ? `/read/eshia/${item.bookId}/${item.volume ?? volume}/${item.page ?? 1}` : `/read/ablibrary/${item.bookId}/${item.page ?? 1}`;
                return <Link key={`${item.title}-${i}`} href={href} className="rounded-xl border border-line/80 bg-[rgb(var(--sheet))]/60 p-3 font-arabic text-ink hover:bg-ink/5" dir="rtl"><span>{item.title}</span>{item.page && <span className="mr-2 font-sans text-xs text-muted" dir="ltr">p. {item.page}</span>}</Link>;
              })}
            </div>
          ) : <p className="font-sans text-muted">No table of contents available.</p>}
        </section>
      </section>
    </main>
  );
}
