import Link from "next/link";
import { normalizeArabic, readerPath, searchTokens, type SearchResult } from "@maktaba-kit/core/client";
import { SourceBadge } from "./SourceBadge";

const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

export function ResultCard({ result, query }: { result: SearchResult; query: string }) {
  const href = readerPath({ source: result.source, bookId: result.bookId ?? "", volume: result.volume, page: result.page });
  return (
    <article className="group rounded-xl border border-line/80 bg-paper/75 p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft" dir="auto">
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <SourceBadge source={result.source} />
        {result.volume && <span className="font-sans text-xs text-muted">vol. {result.volume}</span>}
        {result.page && <span className="font-sans text-xs text-muted">p. {result.page}</span>}
      </div>
      <h3 className="font-arabic text-lg font-semibold text-ink">{result.bookTitle || "Library result"}</h3>
      {result.author && <p className="mt-0.5 font-arabic text-sm text-muted">{result.author}</p>}
      <p className={`result-snippet mt-2 text-sm leading-7 text-ink/90 ${arabicRegex.test(result.snippet || "") ? "font-arabic" : "font-sans"}`}>{highlight(result.snippet || "No excerpt available.", query)}</p>
      <Link href={href} className="mt-3 inline-flex rounded-full bg-ink px-3 py-1 font-sans text-[11px] font-medium text-paper">Open page</Link>
    </article>
  );
}

function highlight(text: string, query: string) {
  const phrase = normalizeArabic(query);
  const tokens = searchTokens(query).filter((token) => token.length > 1);
  if (!phrase && !tokens.length) return text;

  return text.split(/(\s+)/).map((part, index) => {
    const normalized = normalizeArabic(part);
    const matched = normalized && (phrase.includes(normalized) || normalized.includes(phrase) || tokens.some((token) => normalized.includes(token) || token.includes(normalized)));
    return matched ? <mark key={`${part}-${index}`}>{part}</mark> : part;
  });
}
