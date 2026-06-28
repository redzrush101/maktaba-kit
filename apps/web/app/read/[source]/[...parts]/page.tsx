import { readerPath } from "@maktaba-kit/core";
import { maktabaClient } from "@/lib/maktaba-client";
import { Header } from "@/components/Header";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { LibraryActions } from "@/components/LibraryActions";
import type { TocItem } from "@maktaba-kit/core";
import { ReaderTextToggle } from "@/components/ReaderTextToggle";
import { MobileReaderToolbar } from "@/components/MobileReaderToolbar";
import { PageJump } from "@/components/PageJump";
import { ReaderSettings } from "@/components/ReaderSettings";
import { SourceBadge } from "@/components/SourceBadge";
import { ScrollCurrentToc } from "@/components/ScrollCurrentToc";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type VolumeOption = { label: string; value: string };

export default async function ReaderPage({ params }: { params: Promise<{ source: string; parts: string[] }> }) {
  const { source, parts } = await params;
  const sourceName: "ablibrary" | "eshia" | "thaqalayn" = source === "eshia" ? "eshia" : source === "thaqalayn" ? "thaqalayn" : "ablibrary";
  const bookId = sourceName === "thaqalayn" ? parts.slice(0, -1).join("/") : parts[0];
  const volume = sourceName === "eshia" ? parts[1] ?? "1" : undefined;
  const ref = sourceName === "eshia" ? `eshia:${bookId}/${volume}/${parts[2] ?? "1"}` : sourceName === "thaqalayn" ? `thaqalayn:${bookId}/${parts.at(-1) ?? "1"}` : `ablibrary:${bookId}/${parts[1] ?? "1"}`;
  const [res, infoRes, tocRes] = await Promise.all([maktabaClient.read(ref), maktabaClient.info(ref), maktabaClient.toc(ref, 500)]);
  const page = res.data[0];
  const info = infoRes.data[0];
  const pageNo = page?.page ?? Number(parts.at(-1) ?? 1);
  const maxPage = info?.pages ?? (typeof page?.meta?.maxPage === "number" ? page.meta.maxPage : undefined);
  const volumes = (Array.isArray(info?.meta?.volumes) ? info.meta.volumes : []) as VolumeOption[];
  const prevPage = Math.max(1, pageNo - 1);
  const nextPage = maxPage ? Math.min(maxPage, pageNo + 1) : pageNo + 1;
  const prevHref = readerPath({ source: sourceName, bookId, volume, page: prevPage });
  const nextHref = await resolveNextHref({ sourceName, bookId, volume, pageNo, nextPage, toc: tocRes.data });
  const progress = maxPage ? `${Math.min(100, Math.max(2, (pageNo / maxPage) * 100))}%` : "3%";
  const splitText = splitReaderText(page?.text || "", page?.meta?.textEn as string | undefined);
  const arabicText = splitText.arabic || page?.text || "No text is available for this page.";
  const englishText = splitText.english;
  const twoColumnText = arabicText.length > 1800;
  const currentChapterName = typeof page?.meta?.chapterName === "string" ? page.meta.chapterName : undefined;
  const gradings = page?.meta?.gradings as Array<{ grade: string; grader: string; reference?: string }> | undefined;
  const libraryItem = {
    itemRef: ref,
    source: sourceName,
    bookId,
    volume,
    page: pageNo,
    title: page?.bookTitle || info?.title,
    author: page?.author || info?.author,
    url: readerPath({ source: sourceName, bookId, volume, page: pageNo }),
  };

  return (
    <main>
      <Header />
      <KeyboardShortcuts prevHref={prevHref} nextHref={nextHref} />
      {pageNo > 1 && <Link aria-label="Previous page" className="fixed right-3 top-1/2 z-30 hidden -translate-y-1/2 rounded-full border border-line bg-[rgb(var(--sheet))]/90 p-2 text-muted shadow-soft backdrop-blur transition hover:text-ink lg:block" href={prevHref}><ChevronRight size={22} /></Link>}
      {(!maxPage || pageNo < maxPage) && <Link aria-label="Next page" className="fixed left-3 top-1/2 z-30 hidden -translate-y-1/2 rounded-full border border-line bg-[rgb(var(--sheet))]/90 p-2 text-muted shadow-soft backdrop-blur transition hover:text-ink lg:block" href={nextHref}><ChevronLeft size={22} /></Link>}
      <section className="reader-shell mx-auto grid gap-3 px-4 pb-36 lg:grid-cols-[14rem_1fr] lg:pb-10" dir="ltr">
        <aside id="desktop-reader-toc" className="order-2 hidden space-y-2 lg:order-1 lg:sticky lg:top-4 lg:block lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pr-1" dir="ltr">
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
            {volumes.length > 1 && (
              <div className="mt-3">
                <p className="mb-1">Volumes</p>
                <div className="flex gap-1 overflow-x-auto pb-1" dir="ltr">
                  {volumes.map((v) => {
                    const href = sourceName === "eshia" ? `/read/eshia/${bookId}/${v.value}/1` : `/read/ablibrary/${v.value}/1`;
                    const active = sourceName === "eshia" ? v.value === volume : v.value === bookId;
                    return <Link key={v.value} className={`shrink-0 rounded-md border border-line px-2 py-1 ${active ? "bg-ink text-paper" : "text-ink"}`} href={href}>{v.label}</Link>;
                  })}
                </div>
              </div>
            )}
            <LibraryActions {...libraryItem} />
            {page?.url && <a className="mt-3 block rounded-lg border border-line px-2 py-1.5 text-center" href={page.url} target="_blank">Original</a>}
          </div>
          <ReaderSettings />
          {!!tocRes.data.length && (
            <nav className="rounded-xl border border-line bg-[rgb(var(--sheet))]/80 p-3 shadow-sm" aria-label="Table of contents">
              <p className="mb-2 font-sans font-semibold text-ink">Table of contents</p>
              <ScrollCurrentToc containerId="desktop-reader-toc" />
              <div className="space-y-1 text-sm leading-6">
                <TocSections items={tocRes.data} parts={parts} bookId={bookId} volume={volume} pageNo={pageNo} currentChapterName={currentChapterName} />
              </div>
            </nav>
          )}
          {!!res.errors.length && <p className="rounded-xl border border-line p-3 font-sans text-xs text-muted">{res.errors.map((e) => e.message).join("; ")}</p>}
        </aside>
        <article className="book-sheet order-1 rounded-2xl border border-line p-5 pb-24 sm:p-7 sm:pb-28 lg:order-2 lg:p-8" dir="rtl">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <SourceBadge source={source} />
            <span className="font-sans text-sm text-muted" dir="ltr">{ref}</span>
          </div>
          {page ? (
            <>
              <h1 className="font-arabic text-2xl font-bold leading-tight">{page.bookTitle || info?.title || page.label || "Reading page"}</h1>
              {(page.author || info?.author) && <p className="mt-1 font-arabic text-base text-muted">{page.author || info?.author}</p>}
              <div className="my-3 h-px bg-line" />
              <ReaderTextToggle arabic={arabicText} english={englishText} twoColumn={twoColumnText} />
              {gradings?.length ? (
                <section className="mt-5 border-t border-line pt-4">
                  <h2 className="mb-2 font-sans text-lg font-semibold">Hadith Grades</h2>
                  <div className="space-y-3">
                    {gradings.map((g, i) => {
                      const isDaif = /\u0636\u0639\u064A\u0641/.test(g.grade);
                      const isMajhul = /\u0645\u062C\u0647\u0648\u0644/.test(g.grade);
                      const badgeClass = isDaif
                        ? "border-red-500/50 bg-red-300/20 text-red-700 dark:border-red-400/50 dark:bg-red-400/30 dark:text-red-200"
                        : isMajhul
                          ? "border-yellow-600/50 bg-yellow-300/20 text-yellow-800 dark:border-yellow-500/40 dark:bg-yellow-600/30 dark:text-yellow-200"
                          : "border-slate-400/50 bg-slate-300/20 text-slate-700 dark:border-slate-500/40 dark:bg-slate-700/30 dark:text-slate-200";
                      return (
                        <div key={i} className="flex flex-wrap items-start gap-3 rounded-lg border border-line/70 bg-ink/[0.025] p-3 font-sans text-sm">
                          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`} dir="auto">{g.grade}</span>
                          {g.reference && <span className="text-muted" dir="auto">{g.reference}</span>}
                          {g.grader && <span className="text-muted" dir="auto">{g.grader}</span>}
                        </div>
                      );
                    })}
                  </div>
                </section>
              ) : !!page.footnotes?.length && (
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
      <MobileReaderToolbar prevHref={prevHref} nextHref={nextHref} toc={tocRes.data} volumes={volumes} source={sourceName} bookId={bookId} volume={volume} page={pageNo} maxPage={maxPage} bookmarkItem={libraryItem} pageUrl={page?.url} currentChapterName={currentChapterName} />
      <div className="page-progress" aria-hidden="true"><span style={{ width: progress }} /></div>
    </main>
  );
}

async function resolveNextHref({ sourceName, bookId, volume, pageNo, nextPage, toc }: { sourceName: "ablibrary" | "eshia" | "thaqalayn"; bookId: string; volume?: string; pageNo: number; nextPage: number; toc: TocItem[] }) {
  const regularHref = readerPath({ source: sourceName, bookId, volume, page: nextPage });
  if (sourceName !== "thaqalayn") return regularHref;

  const nextRes = await maktabaClient.read(`thaqalayn:${bookId}/${pageNo + 1}`);
  const nextPageData = nextRes.data[0];
  if (nextPageData?.text?.trim() || typeof nextPageData?.meta?.textEn === "string") return regularHref;

  const nextChapter = findNextChapter(toc, bookId);
  return nextChapter ? readerPath({ source: "thaqalayn", bookId: nextChapter.bookId, page: 1 }) : regularHref;
}

function findNextChapter(toc: TocItem[], currentBookId: string) {
  const chapters = toc.filter((item) => item.level !== 0 && item.bookId);
  const currentIndex = chapters.findIndex((item) => item.bookId === currentBookId);
  return currentIndex >= 0 ? chapters[currentIndex + 1] : undefined;
}

function isCurrentTocItem(item: TocItem, bookId: string, pageNo: number) {
  if (item.source === "thaqalayn") return item.bookId === bookId;
  return item.bookId === bookId && item.page === pageNo;
}

function splitReaderText(text: string, english?: string) {
  if (english?.trim()) return { arabic: text, english: english.trim() };
  if (!/[A-Za-z]/.test(text)) return { arabic: text, english: undefined };

  const newlineSplit = text.search(/\n+(?=[A-Za-z0-9])/);
  if (newlineSplit > 0) {
    const arabic = text.slice(0, newlineSplit).trim();
    const latin = text.slice(newlineSplit).trim();
    if (arabic && /[A-Za-z]/.test(latin)) return { arabic, english: latin };
  }

  const latinStart = text.search(/[A-Za-z]/);
  if (latinStart > 0 && /[\u0600-\u06FF]/.test(text.slice(0, latinStart))) {
    return { arabic: text.slice(0, latinStart).trim(), english: text.slice(latinStart).trim() };
  }

  return { arabic: text, english: undefined };
}

function TocSections({ items, parts, bookId, volume, pageNo, currentChapterName }: { items: TocItem[]; parts: string[]; bookId: string; volume?: string; pageNo: number; currentChapterName?: string }) {
  const groups: Array<{ section: TocItem; chapters: TocItem[] }> = [];
  let currentGroup: { section: TocItem; chapters: TocItem[] } | null = null;
  for (const item of items) {
    if (item.level === 0) {
      currentGroup = { section: item, chapters: [] };
      groups.push(currentGroup);
    } else if (currentGroup) {
      currentGroup.chapters.push(item);
    }
  }
  return (
    <>
      {groups.map((group, gi) => {
        const sectionNum = group.section.bookId?.split("/").pop();
        const isCurrentSection = sectionNum === parts[1];
        return (
          <details key={`section-${gi}`} open={isCurrentSection} className="group">
            <summary className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-ink/80 hover:bg-ink/5">
              {group.section.volume && <span className="shrink-0 rounded bg-ink/10 px-1.5 py-0.5 font-sans text-[10px] font-semibold text-muted">{group.section.volume}</span>}
              <span className="font-sans" dir="auto">{group.section.title}</span>
            </summary>
            <div className="ml-2 mt-1 space-y-0.5 border-l-2 border-line/40 pl-2">
              {group.chapters.map((chapter, ci) => {
                const href = chapter.bookId ? readerPath({ source: chapter.source, bookId: chapter.bookId, volume: chapter.volume ?? volume, page: chapter.page ?? 1 }) : "#";
                const active = isCurrentTocItem(chapter, bookId, pageNo);
                const title = active && currentChapterName ? currentChapterName : chapter.title;
                return (
                  <Link key={`ch-${gi}-${ci}`} href={href} aria-current={active ? "page" : undefined} data-current-toc={active ? "true" : undefined} className={`block rounded-lg px-2 py-1 hover:bg-ink/5 ${active ? "bg-accent/15 font-semibold text-ink ring-1 ring-accent/30" : "text-muted"}`} dir="auto">
                    <span className="font-arabic">{title}</span>
                  </Link>
                );
              })}
            </div>
          </details>
        );
      })}
    </>
  );
}
