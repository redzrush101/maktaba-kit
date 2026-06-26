import { createMaktabaClient } from "@maktaba-kit/core";
import { Header } from "@/components/Header";
import { SourceBadge } from "@/components/SourceBadge";
import Link from "next/link";

export default async function ReaderPage({ params }: { params: Promise<{ source: string; parts: string[] }> }) {
  const { source, parts } = await params;
  const ref = source === "eshia" ? `eshia:${parts[0]}/${parts[1] ?? "1"}/${parts[2] ?? "1"}` : `ablibrary:${parts[0]}/${parts[1] ?? "1"}`;
  const client = createMaktabaClient({ timeoutMs: 18_000 });
  const res = await client.read(ref);
  const page = res.data[0];
  const pageNo = page?.page ?? Number(parts.at(-1) ?? 1);
  const prevHref = source === "eshia" ? `/read/eshia/${parts[0]}/${parts[1] ?? "1"}/${Math.max(1, pageNo - 1)}` : `/read/ablibrary/${parts[0]}/${Math.max(1, pageNo - 1)}`;
  const nextHref = source === "eshia" ? `/read/eshia/${parts[0]}/${parts[1] ?? "1"}/${pageNo + 1}` : `/read/ablibrary/${parts[0]}/${pageNo + 1}`;

  return (
    <main>
      <Header />
      <section className="mx-auto grid max-w-4xl gap-3 px-4 pb-8 lg:grid-cols-[1fr_12rem]" dir="rtl">
        <article className="rounded-xl border border-line bg-paper/85 p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <SourceBadge source={source} />
            <span className="font-sans text-sm text-muted" dir="ltr">{ref}</span>
          </div>
          {page ? (
            <>
              <h1 className="font-arabic text-2xl font-bold leading-tight">{page.bookTitle || page.label || "صفحة قراءة"}</h1>
              {page.author && <p className="mt-1 font-arabic text-base text-muted">{page.author}</p>}
              <div className="my-3 h-px bg-line" />
              <div className="reader-text whitespace-pre-line font-arabic text-ink">{page.text || "لا يوجد نص متاح لهذه الصفحة."}</div>
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
        <aside className="space-y-2 lg:sticky lg:top-4 lg:self-start" dir="ltr">
          <div className="rounded-2xl border border-line bg-paper/75 p-3 font-sans text-xs text-muted">
            <p className="font-semibold text-ink">Page tools</p>
            <p className="mt-2">Book {parts[0]} · page {pageNo}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Link className="rounded-xl border border-line px-3 py-2 text-center font-sans text-xs" href={prevHref}>Previous</Link>
            <Link className="rounded-xl bg-ink px-3 py-2 text-center font-sans text-xs text-paper" href={nextHref}>Next</Link>
          </div>
          {page?.url && <a className="block rounded-xl border border-line px-3 py-2 text-center font-sans text-xs" href={page.url} target="_blank">Original source</a>}
          {!!res.errors.length && <p className="rounded-2xl border border-line p-4 font-sans text-xs text-muted">{res.errors.map((e) => e.message).join("; ")}</p>}
        </aside>
      </section>
    </main>
  );
}
