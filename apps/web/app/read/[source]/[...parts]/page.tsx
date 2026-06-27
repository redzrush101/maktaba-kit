import { createMaktabaClient, readerPath } from "@maktaba-kit/core";
import { Header } from "@/components/Header";
import { PageJump } from "@/components/PageJump";
import { ReaderSettings } from "@/components/ReaderSettings";
import { SourceBadge } from "@/components/SourceBadge";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type VolumeOption = { label: string; value: string };

export default async function ReaderPage({ params }: { params: Promise<{ source: string; parts: string[] }> }) {
  const { source, parts } = await params;
  const sourceName = source === "eshia" ? "eshia" : "ablibrary";
  const bookId = parts[0];
  const volume = sourceName === "eshia" ? parts[1] ?? "1" : undefined;
  const ref = sourceName === "eshia" ? `eshia:${bookId}/${volume}/${parts[2] ?? "1"}` : `ablibrary:${bookId}/${parts[1] ?? "1"}`;
  const client = createMaktabaClient({ timeoutMs: 18_000 });
  const [res, infoRes, tocRes] = await Promise.all([client.read(ref), client.info(ref), client.toc(ref, 80)]);
  const page = res.data[0];
  const info = infoRes.data[0];
  const pageNo = page?.page ?? Number(parts.at(-1) ?? 1);
  const maxPage = info?.pages ?? (typeof page?.meta?.maxPage === "number" ? page.meta.maxPage : undefined);
  const volumes = (Array.isArray(info?.meta?.volumes) ? info.meta.volumes : []) as VolumeOption[];
  const prevPage = Math.max(1, pageNo - 1);
  const nextPage = maxPage ? Math.min(maxPage, pageNo + 1) : pageNo + 1;
  const prevHref = readerPath({ source: sourceName, bookId, volume, page: prevPage });
  const nextHref = readerPath({ source: sourceName, bookId, volume, page: nextPage });
  const progress = maxPage ? `${Math.min(100, Math.max(2, (pageNo / maxPage) * 100))}%` : "3%";
  const twoColumnText = (page?.text.length ?? 0) > 1800;

  return (
    <main>
      <Header />
      {pageNo > 1 && <Link aria-label="Previous page" className="fixed right-3 top-1/2 z-30 hidden -translate-y-1/2 rounded-full border border-line bg-[rgb(var(--sheet))]/90 p-2 text-muted shadow-soft backdrop-blur transition hover:text-ink lg:block" href={prevHref}><ChevronRight size={22} /></Link>}
      {(!maxPage || pageNo < maxPage) && <Link aria-label="Next page" className="fixed left-3 top-1/2 z-30 hidden -translate-y-1/2 rounded-full border border-line bg-[rgb(var(--sheet))]/90 p-2 text-muted shadow-soft backdrop-blur transition hover:text-ink lg:block" href={nextHref}><ChevronLeft size={22} /></Link>}
      <section className="reader-shell mx-auto grid gap-3 px-4 pb-28 lg:grid-cols-[14rem_1fr] lg:pb-10" dir="ltr">
        <aside className="order-2 space-y-2 lg:order-1 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pr-1" dir="ltr">
          <div className="rounded-xl border border-line bg-[rgb(var(--sheet))]/80 p-3 font-sans text-xs text-muted shadow-sm">
            <p className="font-semibold text-ink">Navigation</p>
            <p className="mt-1" dir="ltr">Book {bookId}{volume ? ` · vol ${volume}` : ""} · page {pageNo}{maxPage ? ` / ${maxPage}` : ""}</p>
            <div className="mt-3 grid grid-cols-2 gap-1.5" dir="ltr">
              <Link aria-disabled={pageNo <= 1} className="inline-flex items-center justify-center gap-1 rounded-lg border border-line px-2 py-1.5 text-center font-semibold text-ink hover:bg-ink/5 aria-disabled:pointer-events-none aria-disabled:opacity-40" href={prevHref}><ChevronLeft size={14} /> Prev</Link>
              <Link aria-disabled={!!maxPage && pageNo >= maxPage} className="inline-flex items-center justify-center gap-1 rounded-lg bg-ink px-2 py-1.5 text-center font-semibold text-paper hover:opacity-90 aria-disabled:pointer-events-none aria-disabled:opacity-40" href={nextHref}>Next <ChevronRight size={14} /></Link>
            </div>
            <PageJump source={sourceName} bookId={bookId} volume={volume} page={pageNo} maxPage={maxPage} />
            <form action="/search" className="mt-3 space-y-1.5" dir="ltr">
              <input type="hidden" name="source" value={source} />
              <input type="hidden" name="bookId" value={bookId} />
              {source === "eshia" && <input type="hidden" name="volume" value={volume} />}
              <input name="q" className="w-full rounded-lg border border-line bg-transparent px-2 py-1.5 font-sans text-sm text-ink outline-none placeholder:text-muted" placeholder="Search inside book" />
              <button className="w-full rounded-lg bg-accent px-2 py-1.5 font-sans text-xs font-semibold text-paper">Search in book</button>
            </form>
            {source === "eshia" && volumes.length > 0 && (
              <div className="mt-3">
                <p className="mb-1">Volumes</p>
                <div className="flex flex-wrap gap-1" dir="ltr">
                  {volumes.map((v) => <Link key={v.value} className={`rounded-md border border-line px-2 py-1 ${v.value === volume ? "bg-ink text-paper" : "text-ink"}`} href={`/read/eshia/${bookId}/${v.value}/1`}>{v.label}</Link>)}
                </div>
              </div>
            )}
            {page?.url && <a className="mt-3 block rounded-lg border border-line px-2 py-1.5 text-center" href={page.url} target="_blank">Original</a>}
          </div>
          <ReaderSettings />
          {!!tocRes.data.length && (
            <nav className="rounded-xl border border-line bg-[rgb(var(--sheet))]/80 p-3 shadow-sm" aria-label="Table of contents">
              <p className="mb-2 font-sans font-semibold text-ink">Table of contents</p>
              <div className="space-y-1 font-arabic text-sm leading-6">
                {tocRes.data.map((item, i) => {
                  const href = readerPath({ source: item.source, bookId: item.bookId, volume: item.volume ?? volume, page: item.page });
                  const active = item.page && item.page <= pageNo;
                  return <Link key={`${item.title}-${i}`} href={href} className={`block rounded-lg px-2 py-1 hover:bg-ink/5 ${active ? "text-ink" : "text-muted"}`} dir="rtl">{item.title}</Link>;
                })}
              </div>
            </nav>
          )}
          {!!res.errors.length && <p className="rounded-xl border border-line p-3 font-sans text-xs text-muted">{res.errors.map((e) => e.message).join("; ")}</p>}
        </aside>
        <article className="book-sheet order-1 rounded-2xl border border-line p-5 sm:p-7 lg:order-2 lg:p-8" dir="rtl">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <SourceBadge source={source} />
            <span className="font-sans text-sm text-muted" dir="ltr">{ref}</span>
          </div>
          {page ? (
            <>
              <h1 className="font-arabic text-2xl font-bold leading-tight">{page.bookTitle || info?.title || page.label || "Reading page"}</h1>
              {(page.author || info?.author) && <p className="mt-1 font-arabic text-base text-muted">{page.author || info?.author}</p>}
              <div className="my-3 h-px bg-line" />
              <div className={`reader-text whitespace-pre-line font-arabic text-ink ${twoColumnText ? "xl:columns-2 xl:gap-12" : ""}`}>{page.text || "No text is available for this page."}</div>
              {!!page.footnotes?.length && (
                <section className="mt-5 border-t border-line pt-4">
                  <h2 className="mb-2 font-sans text-lg font-semibold">Footnotes</h2>
                  <div className="space-y-2 font-arabic text-sm leading-6 text-ink/85">
                    {page.footnotes.map((note) => <div key={note.id} className="block rounded-lg border border-line/70 bg-ink/[0.025] p-2.5" dir="rtl"><p><span className="ml-2 font-sans text-sm font-semibold text-muted">{note.label}</span>{note.text}</p></div>)}
                  </div>
                </section>
              )}
            </>
          ) : <p className="font-sans text-2xl text-muted">Could not load this page.</p>}
        </article>
      </section>
      <nav className="fixed inset-x-3 bottom-4 z-40 grid grid-cols-2 gap-2 rounded-2xl border border-line bg-[rgb(var(--sheet))]/95 p-2 font-sans text-sm shadow-soft backdrop-blur lg:hidden" dir="ltr" aria-label="Page navigation">
        <Link className="inline-flex items-center justify-center gap-2 rounded-xl border border-line px-3 py-2.5 font-semibold text-ink" href={prevHref}><ChevronLeft size={18} /> Previous</Link>
        <Link className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-3 py-2.5 font-semibold text-paper" href={nextHref}>Next <ChevronRight size={18} /></Link>
      </nav>
      <div className="page-progress" aria-hidden="true"><span style={{ width: progress }} /></div>
    </main>
  );
}
