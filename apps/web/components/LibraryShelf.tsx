"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { bookmarksKey, readItems, recentKey, removeItem, writeItems, type LibraryItem } from "@/lib/library-storage";
import { SourceBadge } from "./SourceBadge";

export function LibraryShelf() {
  const [bookmarks, setBookmarks] = useState<LibraryItem[]>([]);
  const [recent, setRecent] = useState<LibraryItem[]>([]);

  useEffect(() => {
    setBookmarks(readItems(bookmarksKey));
    setRecent(readItems(recentKey));
  }, []);

  function deleteBookmark(ref: string) {
    removeItem(bookmarksKey, ref);
    setBookmarks(readItems(bookmarksKey));
  }

  function updateNote(ref: string, note: string) {
    const next = bookmarks.map((item) => item.ref === ref ? { ...item, note, updatedAt: new Date().toISOString() } : item);
    setBookmarks(next);
    writeItems(bookmarksKey, next);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2" dir="ltr">
      <Shelf title="Bookmarks" items={bookmarks} onRemove={deleteBookmark} onNote={updateNote} empty="Bookmark pages from the reader to build your personal shelf." />
      <Shelf title="Recently read" items={recent} empty="Open a reader page and it will appear here." />
    </div>
  );
}

function Shelf({ title, items, empty, onRemove, onNote }: { title: string; items: LibraryItem[]; empty: string; onRemove?: (ref: string) => void; onNote?: (ref: string, note: string) => void }) {
  return (
    <section className="rounded-2xl border border-line bg-paper/60 p-4 shadow-sm">
      <h2 className="font-sans text-xl font-semibold">{title}</h2>
      {!items.length && <p className="mt-3 font-sans text-sm text-muted">{empty}</p>}
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <article key={item.ref} className="rounded-xl border border-line/80 bg-[rgb(var(--sheet))]/70 p-3">
            <div className="flex items-center justify-between gap-2">
              <SourceBadge source={item.source} />
              <span className="font-sans text-xs text-muted">p. {item.page}{item.volume ? ` · vol. ${item.volume}` : ""}</span>
            </div>
            <h3 className="mt-2 font-arabic text-lg font-semibold" dir="rtl">{item.title || item.ref}</h3>
            {item.author && <p className="mt-1 font-arabic text-sm text-muted" dir="rtl">{item.author}</p>}
            {onNote && <textarea defaultValue={item.note ?? ""} onBlur={(event) => onNote(item.ref, event.currentTarget.value)} placeholder="Add a private note..." className="mt-3 min-h-20 w-full rounded-lg border border-line bg-transparent p-2 font-sans text-sm text-ink outline-none placeholder:text-muted" />}
            <div className="mt-3 flex gap-2 font-sans text-xs">
              <Link href={item.url} className="rounded-full bg-ink px-3 py-1.5 font-semibold text-paper">Open</Link>
              {onRemove && <button type="button" onClick={() => onRemove(item.ref)} className="rounded-full border border-line px-3 py-1.5 text-muted hover:text-ink">Remove</button>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
