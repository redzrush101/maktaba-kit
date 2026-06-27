"use client";

import { useEffect, useMemo, useState } from "react";
import { bookmarksKey, readItems, recentKey, removeItem, upsertItem, type LibraryItem } from "@/lib/library-storage";

export type BookmarkInput = Omit<LibraryItem, "createdAt" | "updatedAt" | "ref"> & { itemRef: string };

export function useLibraryBookmark({ itemRef, ...item }: BookmarkInput) {
  const [bookmarked, setBookmarked] = useState(false);
  const storageItem = useMemo(() => ({ ...item, ref: itemRef }), [itemRef, item.source, item.bookId, item.volume, item.page, item.title, item.author, item.url]);

  useEffect(() => {
    upsertItem(recentKey, storageItem, 50);
    setBookmarked(readItems(bookmarksKey).some((entry) => entry.ref === storageItem.ref));
  }, [storageItem]);

  function toggleBookmark() {
    if (bookmarked) {
      removeItem(bookmarksKey, storageItem.ref);
      setBookmarked(false);
      return;
    }
    upsertItem(bookmarksKey, storageItem, 200);
    setBookmarked(true);
  }

  return { bookmarked, toggleBookmark, storageItem };
}
