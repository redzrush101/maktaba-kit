import { bookPath, type Book } from "@maktaba-kit/core/client";
import Link from "next/link";
import { SourceBadge } from "./SourceBadge";

export function BookCard({ book }: { book: Book }) {
  return (
    <Link href={bookPath({ source: book.source, bookId: book.id, volume: book.volume })} className="rounded-xl border border-line bg-paper/75 p-3 shadow-sm transition hover:shadow-soft" dir="rtl">
      <SourceBadge source={book.source} />
      <h3 className="mt-2 font-arabic text-lg font-semibold">{book.title || book.id}</h3>
      {book.author && <p className="mt-2 font-arabic text-sm text-muted">{book.author}</p>}
      <p className="mt-3 font-sans text-xs text-muted" dir="ltr">{book.pages ? `${book.pages} pages` : "Book record"}{book.volume ? ` · vol. ${book.volume}` : ""}</p>
    </Link>
  );
}
