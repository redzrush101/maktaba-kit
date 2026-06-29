import { Suspense } from "react";
import type { SourceSelect } from "@maktaba-kit/core/client";
import { maktabaClient } from "@/lib/maktaba-client";
import { parseLimit, parseMode, parsePositiveInt, sourceParamValue, type SearchMode } from "@/lib/search-params";
import Link from "next/link";
import { BookCard } from "@/components/BookCard";
import { Header } from "@/components/Header";
import { ResultCard } from "@/components/ResultCard";
import { SearchBox } from "@/components/SearchBox";

function ResultsSkeleton() {
  return (
    <div className="grid gap-2 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-line/80 bg-paper/75 p-3 shadow-sm">
          <div className="mb-2 flex gap-2">
            <div className="h-4 w-16 animate-pulse rounded bg-line" />
            <div className="h-4 w-12 animate-pulse rounded bg-line" />
          </div>
          <div className="mt-2 h-5 w-3/4 animate-pulse rounded bg-line/70" />
          <div className="mt-3 h-3 w-full animate-pulse rounded bg-line/60" />
          <div className="mt-1 h-3 w-5/6 animate-pulse rounded bg-line/60" />
        </div>
      ))}
    </div>
  );
}

function BooksSkeleton() {
  return (
    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-line bg-paper/75 p-3 shadow-sm">
          <div className="h-3 w-16 animate-pulse rounded bg-line" />
          <div className="mt-3 h-5 w-3/4 animate-pulse rounded bg-line/70" />
          <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-line/70" />
        </div>
      ))}
    </div>
  );
}

async function TextResults({ q, source, bookId, volume, limit, page, strictVolume, exact, matchAll }: { q: string; source: SourceSelect; bookId?: string; volume?: string; limit: number; page: number; strictVolume: boolean; exact: boolean; matchAll: boolean }) {
  const textRes = await maktabaClient().search(q, { source, bookId, volume, limit, page, strictVolume, exact, matchAll });
  return (
    <>
      {!!textRes.errors.length && <div className="mb-4 rounded-xl border border-line bg-paper/50 p-3 font-sans text-xs text-muted">Text search: {textRes.errors.map((e) => `${e.source}: ${e.message}`).join("; ")}</div>}
      {!!textRes.data.length && (
        <div className="grid gap-2 lg:grid-cols-2">
          {textRes.data.map((result, i) => <ResultCard key={`${result.source}-${result.bookId}-${result.volume}-${result.page}-${i}`} result={result} query={q} />)}
        </div>
      )}
      {!textRes.data.length && !textRes.errors.length && <p className="font-sans text-sm text-muted">No text matches found.</p>}
    </>
  );
}

async function BookResults({ q, source, limit, page, matchAll }: { q: string; source: SourceSelect; limit: number; page: number; matchAll: boolean }) {
  const booksRes = await maktabaClient().books(q, { source, limit, page, matchAll });
  return (
    <>
      {!!booksRes.errors.length && <div className="mb-4 rounded-xl border border-line bg-paper/50 p-3 font-sans text-xs text-muted">Book search: {booksRes.errors.map((e) => `${e.source}: ${e.message}`).join("; ")}</div>}
      {!!booksRes.data.length && (
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {booksRes.data.map((book, i) => <BookCard key={`${book.source}-${book.id}-${i}`} book={book} />)}
        </div>
      )}
    </>
  );
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const q = params.q ?? "";
  const source = sourceParamValue(params.source);
  const mode = parseMode(params.mode);
  const bookId = params.bookId;
  const volume = params.volume;
  const limit = parseLimit(params.limit, 25, 200, 10);
  const page = parsePositiveInt(params.page, 1);
  const strictVolume = params.strictVolume === "1";
  const exact = params.exact === "1";
  const matchAll = params.matchAll === "1";

  const shouldSearchText = q && (mode === "all" || mode === "text");
  const shouldSearchBooks = q && !bookId && (mode === "all" || mode === "books");

  return (
    <main>
      <Header hideSearch />
      <section className="mx-auto w-full max-w-5xl px-4 pb-8">
        <div className="mb-3" dir="ltr">
          <p className="font-sans text-sm text-muted" dir="ltr">Search results{q ? ` for \u201c${q}\u201d` : ""}</p>
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

        {shouldSearchBooks && (
          <section className="mb-6">
            <h2 className="mb-3 font-sans text-xl font-semibold" dir="ltr">Books and authors</h2>
            <Suspense fallback={<BooksSkeleton />}>
              <BookResults q={q} source={source} limit={mode === "all" ? 8 : limit} page={page} matchAll={matchAll} />
            </Suspense>
          </section>
        )}

        {shouldSearchText && (
          <section>
            <h2 className="mb-3 font-sans text-xl font-semibold" dir="ltr">Text matches</h2>
            <Suspense fallback={<ResultsSkeleton />}>
              <TextResults q={q} source={source} bookId={bookId} volume={volume} limit={limit} page={page} strictVolume={strictVolume} exact={exact} matchAll={matchAll} />
            </Suspense>
          </section>
        )}

        {q && mode !== "books" && (
          <nav className="mt-5 flex items-center justify-center gap-2 font-sans text-sm" dir="ltr" aria-label="Search pagination">
            <Link aria-disabled={page <= 1} className="rounded-full border border-line px-4 py-2 text-ink aria-disabled:pointer-events-none aria-disabled:opacity-40" href={searchHref({ q, source, mode, bookId, volume, limit, strictVolume, exact, matchAll }, { page: Math.max(1, page - 1) })}>Previous</Link>
            <span className="text-muted">Page {page}</span>
            <Link className="rounded-full bg-ink px-4 py-2 text-paper" href={searchHref({ q, source, mode, bookId, volume, limit, strictVolume, exact, matchAll }, { page: page + 1 })}>Next</Link>
          </nav>
        )}
        {q && !shouldSearchText && !shouldSearchBooks && <p className="mt-5 rounded-3xl border border-line p-8 text-center font-sans text-xl text-muted">No results. Try a shorter phrase or a different source.</p>}
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
