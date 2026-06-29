"use client";

import { useEffect, useMemo, useState } from "react";
import { bookmarksKey, readItems, recentKey, removeItem, upsertItem, type LibraryItem } from "@/lib/library-storage";

export type BookmarkInput = Omit<LibraryItem, "createdAt" | "updatedAt" | "ref"> & { itemRef: string };

export function useLibraryBookmark({ itemRef, ...item }: BookmarkInput) {
  const [bookmarked, setBookmarked] = useState(false);
  const depKey = `${itemRef}:${item.source}:${item.bookId}:${item.volume ?? ""}:${item.page}`;
  const storageItem = useMemo(() => ({ ...item, ref: itemRef }), [depKey]);

  useEffect(() => {
    const recent = readItems(recentKey);
    const existing = recent.find((entry) => entry.ref === storageItem.ref);
    if (!existing || existing.page !== storageItem.page) {
      upsertItem(recentKey, storageItem, 50);
    }
    setBookmarked(readItems(bookmarksKey).some((entry) => entry.ref === storageItem.ref));
  }, [depKey, storageItem]);

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
