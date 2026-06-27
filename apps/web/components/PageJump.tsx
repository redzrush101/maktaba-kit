"use client";

import { useState } from "react";

type SourceName = "ablibrary" | "eshia";

export function PageJump({ source, bookId, volume, page, maxPage }: { source: SourceName; bookId: string; volume?: string; page: number; maxPage?: number }) {
  const [value, setValue] = useState(String(page));
  const go = () => {
    const parsed = Math.max(1, Math.min(maxPage ?? Number.POSITIVE_INFINITY, Number(value) || 1));
    window.location.href = source === "eshia" ? `/read/eshia/${bookId}/${volume ?? "1"}/${parsed}` : `/read/ablibrary/${bookId}/${parsed}`;
  };
  return (
    <div className="mt-3 space-y-1.5" dir="ltr">
      <label className="block">Jump to page</label>
      <div className="flex gap-1.5">
        <input value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") go(); }} type="number" min={1} max={maxPage} className="min-w-0 flex-1 rounded-lg border border-line bg-transparent px-2 py-1.5 text-ink outline-none" />
        <button type="button" onClick={go} className="rounded-lg bg-ink px-2 py-1.5 font-semibold text-paper">Go</button>
      </div>
    </div>
  );
}
