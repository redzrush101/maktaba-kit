import { createMaktabaClient, type SourceSelect } from "@maktaba-kit/core";
import { Header } from "@/components/Header";
import { ResultCard } from "@/components/ResultCard";
import { SearchBox } from "@/components/SearchBox";

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const q = params.q ?? "";
  const source = (params.source ?? "all") as SourceSelect;
  const bookId = params.bookId;
  const volume = params.volume;
  const limit = params.limit === "all" ? 0 : Math.min(200, Math.max(10, Number(params.limit ?? 25)));
  const strictVolume = params.strictVolume === "1";
  const res = q ? await createMaktabaClient({ timeoutMs: 18_000 }).search(q, { source, bookId, volume, limit, strictVolume }) : { data: [], errors: [], ok: true };
  return (
    <main>
      <Header />
      <section className="mx-auto w-full max-w-4xl px-4 pb-8">
        <div className="mb-4 rounded-xl border border-line bg-paper/70 p-2 shadow-sm">
          <SearchBox defaultValue={q} defaultSource={source} hiddenFields={{ bookId, volume }} />
        </div>
        <div className="mb-4 flex items-end justify-between gap-3" dir="rtl">
          <div>
            <p className="font-sans text-sm text-muted" dir="ltr">{res.data.length} results</p>
            <h1 className="font-arabic text-2xl font-semibold">{q ? `نتائج البحث عن: ${q}` : "ابدأ بحثاً جديداً"}</h1>
            {bookId && <p className="mt-1 font-sans text-xs text-muted" dir="ltr">inside {source}:{bookId}{volume ? `/${volume}` : ""} · showing {limit === 0 ? "all" : `up to ${limit}`}</p>}
          </div>
          <a href={`/books?q=${encodeURIComponent(q)}`} className="rounded-full border border-line px-3 py-1.5 font-sans text-xs text-muted hover:text-ink">Book search</a>
        </div>
        <form className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-paper/70 p-2 font-sans text-xs text-muted" dir="ltr">
          <input type="hidden" name="q" value={q} />
          <input type="hidden" name="source" value={source} />
          {bookId && <input type="hidden" name="bookId" value={bookId} />}
          {volume && <input type="hidden" name="volume" value={volume} />}
          <label>Results</label>
          <select name="limit" defaultValue={limit === 0 ? "all" : String(limit)} className="rounded-lg border border-line bg-paper px-2 py-1 outline-none">
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="200">200</option>
            <option value="all">All from source</option>
          </select>
          {volume && <label className="inline-flex items-center gap-1"><input type="checkbox" name="strictVolume" value="1" defaultChecked={strictVolume} /> strict volume</label>}
          <button className="rounded-lg bg-ink px-3 py-1 text-paper">Apply</button>
        </form>
        {!!res.errors.length && <div className="mb-6 rounded-2xl border border-line bg-paper p-4 font-sans text-sm text-muted" dir="ltr">Some sources failed: {res.errors.map((e) => `${e.source}: ${e.message}`).join("; ")}</div>}
        <div className="grid gap-2 lg:grid-cols-2">
          {res.data.map((result, i) => <ResultCard key={`${result.source}-${result.bookId}-${result.volume}-${result.page}-${i}`} result={result} query={q} />)}
        </div>
        {q && !res.data.length && <p className="rounded-3xl border border-line p-8 text-center font-arabic text-xl text-muted">لا توجد نتائج. جرّب عبارة أقصر أو مصدراً مختلفاً.</p>}
      </section>
    </main>
  );
}
