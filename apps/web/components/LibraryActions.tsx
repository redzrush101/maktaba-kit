"use client";

import { useEffect, useMemo, useState } from "react";
import { bookmarksKey, readItems, recentKey, removeItem, upsertItem, type LibraryItem } from "@/lib/library-storage";

type Props = Omit<LibraryItem, "createdAt" | "updatedAt" | "ref"> & { itemRef: string };

export function LibraryActions({ itemRef, ...item }: Props) {
  const [bookmarked, setBookmarked] = useState(false);

  const stableItem = useMemo(() => ({ ...item, ref: itemRef }), [itemRef, item.source, item.bookId, item.volume, item.page, item.title, item.author, item.url]);

  useEffect(() => {
    upsertItem(recentKey, stableItem, 50);
    setBookmarked(readItems(bookmarksKey).some((entry) => entry.ref === stableItem.ref));
  }, [stableItem]);

  function toggleBookmark() {
    if (bookmarked) {
      removeItem(bookmarksKey, stableItem.ref);
      setBookmarked(false);
      return;
    }
    upsertItem(bookmarksKey, stableItem, 200);
    setBookmarked(true);
  }

  return (
    <button type="button" onClick={toggleBookmark} className="mt-3 w-full rounded-lg border border-line px-2 py-1.5 text-center font-semibold text-ink hover:bg-ink/5">
      {bookmarked ? "Remove bookmark" : "Bookmark page"}
    </button>
  );
}
