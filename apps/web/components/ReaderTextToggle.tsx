"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export function ReaderTextToggle({ arabic, english, twoColumn }: { arabic: string; english?: string | null; twoColumn?: boolean }) {
  const [showArabic, setShowArabic] = useState(true);

  return (
    <>
      <div className="flex items-center gap-2">
        {english && (
          <button
            type="button"
            onClick={() => setShowArabic((p) => !p)}
            className="flex items-center gap-1 rounded-full border border-line px-3 py-1 font-sans text-xs text-muted transition hover:text-ink"
          >
            {showArabic ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showArabic ? "Hide Arabic" : "Show Arabic"}
          </button>
        )}
      </div>
      {showArabic && (
        <div className={`reader-text mt-2 whitespace-pre-line font-arabic text-ink ${twoColumn ? "xl:columns-2 xl:gap-12" : ""}`} dir="rtl">
          {arabic}
        </div>
      )}
      {english && (
        <div className="mt-3 whitespace-pre-line rounded-xl border border-line/60 bg-paper/40 p-4 font-sans text-sm leading-7 text-ink" dir="ltr">
          {english}
        </div>
      )}
    </>
  );
}
