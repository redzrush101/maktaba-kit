import Link from "next/link";
import type { SearchResult } from "@maktaba-kit/core";
import { SourceBadge } from "./SourceBadge";

export function ResultCard({ result, query }: { result: SearchResult; query: string }) {
  const href = result.source === "eshia"
    ? `/read/eshia/${result.bookId}/${result.volume ?? "1"}/${result.page ?? 1}`
    : `/read/ablibrary/${result.bookId}/${result.page ?? 1}`;
  return (
    <article className="group rounded-xl border border-line/80 bg-paper/75 p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft" dir="rtl">
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <SourceBadge source={result.source} />
        {result.volume && <span className="font-sans text-xs text-muted">vol. {result.volume}</span>}
        {result.page && <span className="font-sans text-xs text-muted">p. {result.page}</span>}
      </div>
      <h3 className="font-arabic text-lg font-semibold text-ink">{result.bookTitle || "نتيجة من المكتبة"}</h3>
      {result.author && <p className="mt-0.5 font-arabic text-sm text-muted">{result.author}</p>}
      <p className="result-snippet mt-2 font-arabic text-sm leading-7 text-ink/90">{highlight(result.snippet || "لا يوجد مقتطف متاح.", query)}</p>
      <Link href={href} className="mt-3 inline-flex rounded-full bg-ink px-3 py-1 font-sans text-[11px] font-medium text-paper">Open page</Link>
    </article>
  );
}

function highlight(text: string, query: string) {
  const q = query.trim();
  if (!q || !text.includes(q)) return text;
  const parts = text.split(q);
  return parts.flatMap((p, i) => i === parts.length - 1 ? [p] : [p, <mark key={i}>{q}</mark>]);
}
