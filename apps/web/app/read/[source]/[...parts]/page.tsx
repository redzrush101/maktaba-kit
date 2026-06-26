import { createMaktabaClient } from "@maktaba-kit/core";
import { Header } from "@/components/Header";
import { SourceBadge } from "@/components/SourceBadge";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default async function ReaderPage({ params }: { params: Promise<{ source: string; parts: string[] }> }) {
  const { source, parts } = await params;
  const ref = source === "eshia" ? `eshia:${parts[0]}/${parts[1] ?? "1"}/${parts[2] ?? "1"}` : `ablibrary:${parts[0]}/${parts[1] ?? "1"}`;
  const client = createMaktabaClient({ timeoutMs: 18_000 });
  const res = await client.read(ref);
  const page = res.data[0];
  const pageNo = page?.page ?? Number(parts.at(-1) ?? 1);
  const prevHref = source === "eshia" ? `/read/eshia/${parts[0]}/${parts[1] ?? "1"}/${Math.max(1, pageNo - 1)}` : `/read/ablibrary/${parts[0]}/${Math.max(1, pageNo - 1)}`;
  const nextHref = source === "eshia" ? `/read/eshia/${parts[0]}/${parts[1] ?? "1"}/${pageNo + 1}` : `/read/ablibrary/${parts[0]}/${pageNo + 1}`;
  const progress = `${Math.min(100, Math.max(3, pageNo / 4))}%`;
  const twoColumnText = (page?.text.length ?? 0) > 1800;

  return (
    <main>
      <Header />
      <Link aria-label="Previous page" className="fixed right-3 top-1/2 z-30 hidden -translate-y-1/2 rounded-full border border-line bg-[rgb(var(--sheet))]/90 p-2 text-muted shadow-soft backdrop-blur transition hover:text-ink lg:block" href={prevHref}>
        <ChevronRight size={22} />
      </Link>
      <Link aria-label="Next page" className="fixed left-3 top-1/2 z-30 hidden -translate-y-1/2 rounded-full border border-line bg-[rgb(var(--sheet))]/90 p-2 text-muted shadow-soft backdrop-blur transition hover:text-ink lg:block" href={nextHref}>
        <ChevronLeft size={22} />
      </Link>
      <section className="mx-auto grid max-w-6xl gap-3 px-4 pb-28 lg:grid-cols-[10rem_1fr] lg:pb-10" dir="rtl">
        <aside className="order-2 space-y-2 lg:order-1 lg:sticky lg:top-4 lg:self-start" dir="rtl">
          <div className="rounded-xl border border-line bg-[rgb(var(--sheet))]/80 p-3 font-sans text-xs text-muted shadow-sm">
            <p className="font-semibold text-ink">الملاحة</p>
            <p className="mt-1" dir="ltr">Book {parts[0]} · page {pageNo}</p>
            <div className="mt-3 grid grid-cols-2 gap-1.5" dir="ltr">
              <Link className="inline-flex items-center justify-center gap-1 rounded-lg border border-line px-2 py-1.5 text-center font-semibold text-ink hover:bg-ink/5" href={prevHref}>
                <ChevronLeft size={14} /> Prev
              </Link>
              <Link className="inline-flex items-center justify-center gap-1 rounded-lg bg-ink px-2 py-1.5 text-center font-semibold text-paper hover:opacity-90" href={nextHref}>
                Next <ChevronRight size={14} />
              </Link>
            </div>
            <form action="/search" className="mt-3 space-y-1.5" dir="rtl">
              <input type="hidden" name="source" value={source} />
              <input type="hidden" name="bookId" value={parts[0]} />
              {source === "eshia" && <input type="hidden" name="volume" value={parts[1] ?? "1"} />}
              <input name="q" className="w-full rounded-lg border border-line bg-transparent px-2 py-1.5 font-arabic text-sm text-ink outline-none placeholder:text-muted" placeholder="ابحث داخل الكتاب" />
              <button className="w-full rounded-lg bg-accent px-2 py-1.5 font-sans text-xs font-semibold text-paper">Search in book</button>
            </form>
            {page?.url && <a className="mt-2 block rounded-lg border border-line px-2 py-1.5 text-center" href={page.url} target="_blank">Original</a>}
          </div>
          {!!res.errors.length && <p className="rounded-xl border border-line p-3 font-sans text-xs text-muted">{res.errors.map((e) => e.message).join("; ")}</p>}
        </aside>
        <article className="book-sheet order-1 rounded-2xl border border-line p-5 sm:p-7 lg:order-2 lg:p-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <SourceBadge source={source} />
            <span className="font-sans text-sm text-muted" dir="ltr">{ref}</span>
          </div>
          {page ? (
            <>
              <h1 className="font-arabic text-2xl font-bold leading-tight">{page.bookTitle || page.label || "صفحة قراءة"}</h1>
              {page.author && <p className="mt-1 font-arabic text-base text-muted">{page.author}</p>}
              <div className="my-3 h-px bg-line" />
              <div className={`reader-text whitespace-pre-line font-arabic text-ink ${twoColumnText ? "xl:columns-2 xl:gap-12" : ""}`}>{page.text || "لا يوجد نص متاح لهذه الصفحة."}</div>
              {!!page.footnotes?.length && (
                <section className="mt-5 border-t border-line pt-4">
                  <h2 className="mb-2 font-arabic text-lg font-semibold">الحواشي</h2>
                  <div className="space-y-2 font-arabic text-sm leading-6 text-ink/85">
                    {page.footnotes.map((note) => (
                      <div key={note.id} className="block rounded-lg border border-line/70 bg-ink/[0.025] p-2.5" dir="rtl">
                        <p className="block whitespace-normal text-right">
                          <span className="ml-2 font-sans text-sm font-semibold text-muted">{note.label}</span>
                          {note.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            <p className="font-arabic text-2xl text-muted">تعذر تحميل الصفحة.</p>
          )}
        </article>
      </section>
      <nav className="fixed inset-x-3 bottom-4 z-40 grid grid-cols-2 gap-2 rounded-2xl border border-line bg-[rgb(var(--sheet))]/95 p-2 font-sans text-sm shadow-soft backdrop-blur lg:hidden" dir="ltr" aria-label="Page navigation">
        <Link className="inline-flex items-center justify-center gap-2 rounded-xl border border-line px-3 py-2.5 font-semibold text-ink" href={prevHref}>
          <ChevronLeft size={18} /> Previous
        </Link>
        <Link className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-3 py-2.5 font-semibold text-paper" href={nextHref}>
          Next <ChevronRight size={18} />
        </Link>
      </nav>
      <div className="page-progress" aria-hidden="true"><span style={{ width: progress }} /></div>
    </main>
  );
}
