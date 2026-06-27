import { bookPath, createMaktabaClient, type Book, type SearchResult, type SourceSelect } from "@maktaba-kit/core";
import Link from "next/link";
import { Header } from "@/components/Header";
import { ResultCard } from "@/components/ResultCard";
import { SearchBox, type SearchMode } from "@/components/SearchBox";
import { SourceBadge } from "@/components/SourceBadge";

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
  const client = createMaktabaClient({ timeoutMs: 18_000 });

  const shouldSearchText = q && (mode === "all" || mode === "text");
  const shouldSearchBooks = q && !bookId && (mode === "all" || mode === "books");
  const [textRes, booksRes] = await Promise.all([
    shouldSearchText ? client.search(q, { source, bookId, volume, limit, page, strictVolume, exact }) : emptySearch(),
    shouldSearchBooks ? client.books(q, { source, limit: mode === "all" ? 8 : limit, page }) : emptyBooks(),
  ]);
  const errors = [...textRes.errors, ...booksRes.errors];

  return (
    <main>
      <Header />
      <section className="mx-auto w-full max-w-5xl px-4 pb-8">
        <div className="mb-4 rounded-xl border border-line bg-paper/70 p-2 shadow-sm">
          <SearchBox defaultValue={q} defaultSource={source} defaultMode={mode} hiddenFields={{ bookId, volume }} showMode={!bookId} />
        </div>
        <div className="mb-4 flex items-end justify-between gap-3" dir="ltr">
          <div>
            <p className="font-sans text-sm text-muted" dir="ltr">{booksRes.data.length} books/authors · {textRes.data.length} text results</p>
            <h1 className="font-sans text-2xl font-semibold">{q ? `Search results for: ${q}` : "Start a new search"}</h1>
            {bookId && <p className="mt-1 font-sans text-xs text-muted" dir="ltr">inside {source}:{bookId}{volume ? `/${volume}` : ""} · page {page} · showing {limit === 0 ? "all" : `up to ${limit}`}</p>}
          </div>
          <Link href={`/search?${new URLSearchParams({ q, source, mode: "books" }).toString()}`} className="rounded-full border border-line px-3 py-1.5 font-sans text-xs text-muted hover:text-ink">Books/authors only</Link>
        </div>
        <form className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-paper/70 p-2 font-sans text-xs text-muted" dir="ltr">
          <input type="hidden" name="q" value={q} />
          <input type="hidden" name="source" value={source} />
          {bookId && <input type="hidden" name="mode" value={mode} />}
          {bookId && <input type="hidden" name="bookId" value={bookId} />}
          {volume && <input type="hidden" name="volume" value={volume} />}
          <input type="hidden" name="page" value="1" />
          <label>Results</label>
          <select name="limit" defaultValue={limit === 0 ? "all" : String(limit)} className="rounded-lg border border-line bg-paper px-2 py-1 outline-none">
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="200">200</option>
            <option value="all">All from source</option>
          </select>
          {!bookId && (
            <select name="mode" defaultValue={mode} className="rounded-lg border border-line bg-paper px-2 py-1 outline-none">
              <option value="all">Everything</option>
              <option value="text">Text only</option>
              <option value="books">Books/authors only</option>
            </select>
          )}
          {volume && <label className="inline-flex items-center gap-1"><input type="checkbox" name="strictVolume" value="1" defaultChecked={strictVolume} /> strict volume</label>}
          <label className="inline-flex items-center gap-1"><input type="checkbox" name="exact" value="1" defaultChecked={exact} /> exact phrase</label>
          <button className="rounded-lg bg-ink px-3 py-1 text-paper">Apply</button>
        </form>
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
            <Link aria-disabled={page <= 1} className="rounded-full border border-line px-4 py-2 text-ink aria-disabled:pointer-events-none aria-disabled:opacity-40" href={`/search?${new URLSearchParams({ q, source, mode, ...(bookId ? { bookId } : {}), ...(volume ? { volume } : {}), limit: limit === 0 ? "all" : String(limit), page: String(Math.max(1, page - 1)), ...(strictVolume ? { strictVolume: "1" } : {}), ...(exact ? { exact: "1" } : {}) }).toString()}`}>Previous</Link>
            <span className="text-muted">Page {page}</span>
            <Link aria-disabled={!textRes.data.length || (limit > 0 && textRes.data.length < limit)} className="rounded-full bg-ink px-4 py-2 text-paper aria-disabled:pointer-events-none aria-disabled:opacity-40" href={`/search?${new URLSearchParams({ q, source, mode, ...(bookId ? { bookId } : {}), ...(volume ? { volume } : {}), limit: limit === 0 ? "all" : String(limit), page: String(page + 1), ...(strictVolume ? { strictVolume: "1" } : {}), ...(exact ? { exact: "1" } : {}) }).toString()}`}>Next</Link>
          </nav>
        )}
        {q && !textRes.data.length && !booksRes.data.length && <p className="mt-5 rounded-3xl border border-line p-8 text-center font-sans text-xl text-muted">No results. Try a shorter phrase or a different source.</p>}
      </section>
    </main>
  );
}

function BookCard({ book }: { book: Book }) {
  return (
    <Link href={bookPath({ source: book.source, bookId: book.id, volume: book.volume })} className="rounded-xl border border-line bg-paper/75 p-3 shadow-sm transition hover:shadow-soft" dir="rtl">
      <SourceBadge source={book.source} />
      <h3 className="mt-2 font-arabic text-lg font-semibold">{book.title || book.id}</h3>
      {book.author && <p className="mt-2 font-arabic text-sm text-muted">{book.author}</p>}
      <p className="mt-3 font-sans text-xs text-muted" dir="ltr">{book.pages ? `${book.pages} pages` : "Book record"}{book.volume ? ` · vol. ${book.volume}` : ""}</p>
    </Link>
  );
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
