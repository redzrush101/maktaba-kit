import { groupTocSections, normalizeSource, readerPath, refString } from "@maktaba-kit/core/client";
import { maktabaClient } from "@/lib/maktaba-client";
import { Header } from "@/components/Header";
import { SearchBox } from "@/components/SearchBox";
import { SourceBadge } from "@/components/SourceBadge";
import Link from "next/link";

export default async function BookPage({ params, searchParams }: { params: Promise<{ source: string; bookId: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { source, bookId } = await params;
  const { volume = "1" } = await searchParams;
  const sourceName = normalizeSource(source);
  const ref = refString({ source: sourceName, bookId, volume: sourceName === "eshia" ? volume : undefined, page: 1 });
  const [infoRes, tocRes] = await Promise.all([maktabaClient.info(ref), maktabaClient.toc(ref, 120)]);
  const book = infoRes.data[0];
  const volumes = (Array.isArray(book?.meta?.volumes) ? book.meta.volumes : []) as Array<{ label: string; value: string }>;
  const categories = (Array.isArray(book?.meta?.categories) ? book.meta.categories : []) as Array<{ id?: string; name?: string }>;
  const blurb = typeof book?.meta?.blurbEn === "string" ? book.meta.blurbEn : undefined;
  const translator = typeof book?.meta?.translator === "string" ? book.meta.translator : undefined;
  const authorLink = typeof book?.meta?.authorLink === "string" ? book.meta.authorLink : undefined;
  const firstToc = tocRes.data[0];
  const readHref = firstToc ? readerPath({ source: firstToc.source, bookId: firstToc.bookId, volume: firstToc.volume, page: firstToc.page ?? 1 }) : readerPath({ source: sourceName, bookId, volume, page: 1 });

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
          {book?.author && <p className="mt-2 font-arabic text-lg text-muted" dir="rtl">{authorLink ? <a className="underline decoration-line underline-offset-4" href={authorLink} target="_blank">{book.author}</a> : book.author}</p>}
          {translator && <p className="mt-1 font-sans text-sm text-muted">Translated by {translator}</p>}
          {blurb && <p className="mt-4 max-w-3xl whitespace-pre-line font-sans text-sm leading-7 text-ink/80" dir="ltr">{blurb}</p>}
          <div className="mt-4 flex flex-wrap gap-2 font-sans text-xs text-muted" dir="ltr">
            {book?.pages && <span className="rounded-full border border-line px-3 py-1">{book.pages} pages</span>}
            {book?.volume && <span className="rounded-full border border-line px-3 py-1">volume {book.volume}</span>}
          </div>
          {!!categories.length && <div className="mt-4 flex flex-wrap gap-2 font-arabic text-sm text-muted" dir="rtl">{categories.map((category, i) => category.name ? (category.id ? <Link key={`${category.name}-${i}`} href={`/categories/${category.id}`} className="inline-flex min-h-11 items-center rounded-full border border-line px-4 py-2 hover:text-ink">{category.name}</Link> : <span key={`${category.name}-${i}`} className="inline-flex min-h-11 items-center rounded-full border border-line px-4 py-2">{category.name}</span>) : null)}</div>}
          <div className="mt-5 flex flex-wrap gap-2 font-sans text-sm" dir="ltr">
            <Link href={readHref} className="rounded-full bg-ink px-4 py-2 font-semibold text-paper">Read</Link>
            {book?.url && <a href={book.url} target="_blank" className="rounded-full border border-line px-4 py-2 text-ink">Original</a>}
          </div>
        </div>

        {volumes.length > 0 && (
          <section className="mt-4 rounded-2xl border border-line bg-paper/60 p-4">
            <h2 className="mb-3 font-sans text-xl font-semibold">Volumes</h2>
            <div className="flex snap-x gap-2 overflow-x-auto pb-1" dir="ltr">
              {volumes.map((v) => {
                const href = source === "eshia" ? `/books/${source}/${bookId}?volume=${v.value}` : source === "thaqalayn" ? `/books/thaqalayn/${v.value}` : `/books/ablibrary/${v.value}`;
                const active = source === "eshia" ? v.value === volume : v.value === bookId;
                return <Link key={v.value} href={href} className={`inline-flex min-h-11 shrink-0 snap-start items-center rounded-full border border-line px-4 py-2 font-sans text-sm ${active ? "bg-ink text-paper" : "text-ink"}`}>{v.label}</Link>;
              })}
            </div>
          </section>
        )}

        <section className="mt-4 rounded-2xl border border-line bg-paper/60 p-4">
          <h2 className="mb-3 font-sans text-xl font-semibold">Search inside this book</h2>
          <SearchBox hiddenFields={{ bookId, volume: source === "eshia" ? volume : undefined }} defaultSource={source} defaultMode="text" showMode={false} placeholder="Search inside this book..." />
        </section>

        <section className="mt-4 rounded-2xl border border-line bg-paper/60 p-4">
          <h2 className="mb-3 font-sans text-xl font-semibold">Table of contents</h2>
          {tocRes.data.length ? <BookTocAccordion items={tocRes.data} volume={volume} /> : <p className="font-sans text-muted">No table of contents available.</p>}
        </section>
      </section>
    </main>
  );
}

type BookTocItem = Awaited<ReturnType<typeof maktabaClient.toc>>["data"][number];

function BookTocAccordion({ items, volume }: { items: BookTocItem[]; volume: string }) {
  const hasSections = items.some((item) => item.level === 0);

  if (!hasSections) {
    return (
      <div className="space-y-1">
        {items.map((item, index) => <TocLink key={`${item.title}-${index}`} item={item} volume={volume} />)}
      </div>
    );
  }

  const groups = groupTocSections(items);

  return (
    <div className="space-y-2">
      {groups.map((group, index) => (
        <details key={`toc-group-${index}`} open={index === 0} className="rounded-2xl border border-line/80 bg-[rgb(var(--sheet))]/60 p-2">
          <summary className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-2 py-2 font-sans text-xs font-semibold text-ink/80 hover:bg-ink/5" dir="auto">
            {group.section.volume && <span className="shrink-0 rounded bg-ink/10 px-1.5 py-0.5 font-sans text-[10px] font-semibold text-muted">{group.section.volume}</span>}
            <span>{group.section.title}</span>
          </summary>
          <div className="mt-1 space-y-1">
            {group.chapters.length ? group.chapters.map((item, i) => <TocLink key={`${item.title}-${index}-${i}`} item={item} volume={volume} />) : <TocLink item={group.section} volume={volume} />}
          </div>
        </details>
      ))}
    </div>
  );
}

function TocLink({ item, volume }: { item: BookTocItem; volume: string }) {
  const href = readerPath({ source: item.source, bookId: item.bookId, volume: item.volume ?? volume, page: item.page ?? 1 });
  return (
    <Link href={href} className="flex min-h-11 items-start justify-between gap-3 rounded-xl border border-line/80 bg-[rgb(var(--sheet))]/60 p-3 text-ink hover:bg-ink/5" dir="rtl">
      <span className="min-w-0 flex-1 text-right font-arabic" dir="auto">{item.title}</span>
      {shouldShowTocPage(item) && <span className="shrink-0 whitespace-nowrap pt-1 font-sans text-xs text-muted [unicode-bidi:isolate]" dir="ltr">p. {item.page}</span>}
    </Link>
  );
}

function shouldShowTocPage(item: BookTocItem) {
  return !!item.page && !(item.source === "thaqalayn" && item.page === 1);
}
