import { type Book, type SearchResult, type SourceSelect } from "@maktaba-kit/core";
import { maktabaClient } from "@/lib/maktaba-client";
import Link from "next/link";
import { BookCard } from "@/components/BookCard";
import { Header } from "@/components/Header";
import { ResultCard } from "@/components/ResultCard";
import { SearchBox } from "@/components/SearchBox";

type SearchMode = "all" | "text" | "books";

type SearchResponse = { data: SearchResult[]; errors: Array<{ source: string; message: string }>; ok: boolean };
type BooksResponse = { data: Book[]; errors: Array<{ source: string; message: string }>; ok: boolean };

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const q = params.q ?? "";
  const source = (params.source ?? "all") as SourceSelect;
  const mode = parseMode(params.mode);
  const bookId = params.bookId;
  const volume = params.volume;
  const limit = params.limit === "all" ? 0 : Math.min(200, Math.max(10, Number(params.limit ?? 25)));
  const page = Math.max(1, Number(params.page ?? 1));
  const strictVolume = params.strictVolume === "1";
  const exact = params.exact === "1";
  const matchAll = params.matchAll === "1";
  const client = maktabaClient;

  const shouldSearchText = q && (mode === "all" || mode === "text");
  const shouldSearchBooks = q && !bookId && (mode === "all" || mode === "books");
  const [textRes, booksRes] = await Promise.all([
    shouldSearchText ? client.search(q, { source, bookId, volume, limit, page, strictVolume, exact, matchAll }) : emptySearch(),
    shouldSearchBooks ? client.books(q, { source, limit: mode === "all" ? 8 : limit, page, matchAll }) : emptyBooks(),
  ]);
  const errors = [...textRes.errors, ...booksRes.errors];

  return (
    <main>
      <Header hideSearch />
      <section className="mx-auto w-full max-w-5xl px-4 pb-8">
        <div className="mb-3" dir="ltr">
          <p className="font-sans text-sm text-muted" dir="ltr">{booksRes.data.length} books/authors · {textRes.data.length} text results{q ? ` · “${q}”` : ""}</p>
          {bookId && <p className="mt-1 font-sans text-xs text-muted" dir="ltr">inside {source}:{bookId}{volume ? `/${volume}` : ""} · page {page} · showing {limit === 0 ? "all" : `up to ${limit}`}</p>}
        </div>
        <div className="mb-5">
          <SearchBox
            defaultValue={q}
            defaultSource={source}
            defaultMode={mode}
            showMode={!bookId}
            hiddenFields={{ bookId, volume }}
            placeholder="Search books, authors, or text..."
            advanced={{ limit, strictVolume, exact, matchAll, showStrictVolume: Boolean(volume) }}
          />
        </div>
        {!!errors.length && <div className="mb-6 rounded-2xl border border-line bg-paper p-4 font-sans text-sm text-muted" dir="ltr">Some sources failed: {errors.map((e) => `${e.source}: ${e.message}`).join("; ")}</div>}

        {!!booksRes.data.length && (
          <section className="mb-6">
            <h2 className="mb-3 font-sans text-xl font-semibold" dir="ltr">Books and authors</h2>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {booksRes.data.map((book, i) => <BookCard key={`${book.source}-${book.id}-${i}`} book={book} />)}
            </div>
          </section>
        )}

        {!!textRes.data.length && (
          <section>
            <h2 className="mb-3 font-sans text-xl font-semibold" dir="ltr">Text matches</h2>
            <div className="grid gap-2 lg:grid-cols-2">
              {textRes.data.map((result, i) => <ResultCard key={`${result.source}-${result.bookId}-${result.volume}-${result.page}-${i}`} result={result} query={q} />)}
            </div>
          </section>
        )}

        {q && mode !== "books" && (
          <nav className="mt-5 flex items-center justify-center gap-2 font-sans text-sm" dir="ltr" aria-label="Search pagination">
            <Link aria-disabled={page <= 1} className="rounded-full border border-line px-4 py-2 text-ink aria-disabled:pointer-events-none aria-disabled:opacity-40" href={searchHref({ q, source, mode, bookId, volume, limit, strictVolume, exact, matchAll }, { page: Math.max(1, page - 1) })}>Previous</Link>
            <span className="text-muted">Page {page}</span>
            <Link aria-disabled={!textRes.data.length || (limit > 0 && textRes.data.length < limit)} className="rounded-full bg-ink px-4 py-2 text-paper aria-disabled:pointer-events-none aria-disabled:opacity-40" href={searchHref({ q, source, mode, bookId, volume, limit, strictVolume, exact, matchAll }, { page: page + 1 })}>Next</Link>
          </nav>
        )}
        {q && !textRes.data.length && !booksRes.data.length && <p className="mt-5 rounded-3xl border border-line p-8 text-center font-sans text-xl text-muted">No results. Try a shorter phrase or a different source.</p>}
      </section>
    </main>
  );
}

function searchHref(current: { q: string; source: SourceSelect; mode: SearchMode; bookId?: string; volume?: string; limit: number; strictVolume: boolean; exact: boolean; matchAll: boolean }, overrides: { page: number }) {
  return `/search?${new URLSearchParams({
    q: current.q,
    source: current.source,
    mode: current.mode,
    ...(current.bookId ? { bookId: current.bookId } : {}),
    ...(current.volume ? { volume: current.volume } : {}),
    limit: current.limit === 0 ? "all" : String(current.limit),
    page: String(overrides.page),
    ...(current.strictVolume ? { strictVolume: "1" } : {}),
    ...(current.exact ? { exact: "1" } : {}),
    ...(current.matchAll ? { matchAll: "1" } : {}),
  }).toString()}`;
}

function parseMode(value: string | undefined): SearchMode {
  return value === "text" || value === "books" || value === "all" ? value : "all";
}

function emptySearch(): SearchResponse {
  return { data: [], errors: [], ok: true };
}

function emptyBooks(): BooksResponse {
  return { data: [], errors: [], ok: true };
}
