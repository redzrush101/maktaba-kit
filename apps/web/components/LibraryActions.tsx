"use client";

import { type BookmarkInput, useLibraryBookmark } from "./useLibraryBookmark";

export function LibraryActions(props: BookmarkInput) {
  const { bookmarked, toggleBookmark } = useLibraryBookmark(props);

  return (
    <button type="button" onClick={toggleBookmark} className="mt-3 w-full rounded-lg border border-line px-2 py-1.5 text-center font-semibold text-ink hover:bg-ink/5">
      {bookmarked ? "Remove bookmark" : "Bookmark page"}
    </button>
  );
}
