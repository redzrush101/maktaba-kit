"use client";

import { Bookmark, Check, List, SlidersHorizontal, Type, X, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { TocItem } from "@maktaba-kit/core";
import { type BookmarkInput, useLibraryBookmark } from "./useLibraryBookmark";
import { type ReaderSettingsState, readerSettingsOptions, useReaderSettings } from "./useReaderSettings";

type VolumeOption = { label: string; value: string };
type Panel = "toc" | "settings" | "tools" | null;


export function MobileReaderToolbar({
  prevHref,
  nextHref,
  toc,
  volumes,
  source,
  bookId,
  volume,
  page,
  maxPage,
  bookmarkItem,
  pageUrl,
}: {
  prevHref: string;
  nextHref: string;
  toc: TocItem[];
  volumes: VolumeOption[];
  source: "ablibrary" | "eshia" | "thaqalayn";
  bookId: string;
  volume?: string;
  page: number;
  maxPage?: number;
  bookmarkItem: BookmarkInput;
  pageUrl?: string;
}) {
  const [panel, setPanel] = useState<Panel>(null);
  const [jump, setJump] = useState(String(page));
  const { bookmarked, toggleBookmark } = useLibraryBookmark(bookmarkItem);
  const { settings, update } = useReaderSettings();

  function goToPage() {
    const parsed = Math.max(1, Math.min(maxPage ?? Number.POSITIVE_INFINITY, Number(jump) || 1));
    window.location.href = source === "eshia" ? `/read/eshia/${bookId}/${volume ?? "1"}/${parsed}` : source === "thaqalayn" ? `/read/thaqalayn/${bookId}/${parsed}` : `/read/ablibrary/${bookId}/${parsed}`;
  }

  return (
    <>
      {panel && <button aria-label="Close reader panel" className="fixed inset-0 z-40 bg-black/35 lg:hidden" type="button" onClick={() => setPanel(null)} />}
      {panel && (
        <section className="fixed inset-x-2 bottom-[4.75rem] z-50 max-h-[70vh] overflow-y-auto rounded-2xl border border-line bg-[rgb(var(--sheet))] p-4 shadow-soft lg:hidden" dir="ltr">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-sans text-base font-semibold text-ink">{panelTitle(panel)}</h2>
            <button type="button" onClick={() => setPanel(null)} className="rounded-full border border-line p-2 text-muted"><X size={18} /></button>
          </div>
          {panel === "toc" && (
            <div className="space-y-1 font-arabic text-sm leading-6" dir="rtl">
              {toc.length ? toc.map((item, index) => {
                const href = item.source === "eshia" ? `/read/eshia/${item.bookId}/${item.volume ?? volume ?? "1"}/${item.page ?? 1}` : item.source === "thaqalayn" ? `/read/thaqalayn/${item.bookId}/${item.page ?? 1}` : `/read/ablibrary/${item.bookId}/${item.page ?? 1}`;
                return <Link key={`${item.title}-${index}`} href={href} className="block rounded-lg border border-line/60 bg-paper/40 px-3 py-2 text-ink" dir="auto">{item.title}</Link>;
              }) : <p className="font-sans text-sm text-muted" dir="ltr">No table of contents available.</p>}
            </div>
          )}
          {panel === "settings" && (
            <div className="grid gap-3 font-sans text-sm text-muted">
              <Select label="Theme" value={settings.theme} options={readerSettingsOptions.theme} onChange={(value) => update("theme", value as ReaderSettingsState["theme"])} />
              <Select label="Text size" value={settings.size} options={readerSettingsOptions.size} onChange={(value) => update("size", value as ReaderSettingsState["size"])} />
              <Select label="Line spacing" value={settings.leading} options={readerSettingsOptions.leading} onChange={(value) => update("leading", value as ReaderSettingsState["leading"])} />
            </div>
          )}
          {panel === "tools" && (
            <div className="space-y-4 font-sans text-sm">
              {pageUrl && (
                <a href={pageUrl} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-center rounded-xl border border-line text-ink">
                  Open original
                </a>
              )}
              {volumes.length > 1 && (
                <div>
                  <p className="mb-2 font-semibold text-ink">Volumes</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {volumes.map((v) => {
                      const href = source === "eshia" ? `/read/eshia/${bookId}/${v.value}/1` : source === "thaqalayn" ? `/read/thaqalayn/${v.value}/1` : `/read/ablibrary/${v.value}/1`;
                      const active = source === "eshia" ? v.value === volume : v.value === bookId;
                      return <Link key={v.value} href={href} className={`min-h-11 rounded-full border border-line px-4 py-2 ${active ? "bg-ink text-paper" : "text-ink"}`}>{v.label}</Link>;
                    })}
                  </div>
                </div>
              )}
              <div>
                <p className="mb-2 font-semibold text-ink">Jump to page</p>
                <div className="flex gap-2">
                  <input value={jump} onChange={(event) => setJump(event.currentTarget.value)} type="number" min={1} max={maxPage} className="min-h-11 min-w-0 flex-1 rounded-xl border border-line bg-transparent px-3 text-ink outline-none" />
                  <button type="button" onClick={goToPage} className="min-h-11 rounded-xl bg-ink px-4 font-semibold text-paper">Go</button>
                </div>
              </div>
              <form action="/search" className="space-y-2">
                <input type="hidden" name="source" value={source} />
                <input type="hidden" name="bookId" value={bookId} />
                {source === "eshia" && <input type="hidden" name="volume" value={volume} />}
                <input name="q" className="min-h-11 w-full rounded-xl border border-line bg-transparent px-3 text-ink outline-none placeholder:text-muted" placeholder="Search inside this book" />
                <button className="min-h-11 w-full rounded-xl bg-accent px-4 font-semibold text-paper">Search in book</button>
              </form>
            </div>
          )}
        </section>
      )}
      <nav className="fixed inset-x-2 bottom-3 z-50 grid grid-cols-5 items-center gap-1 rounded-2xl border border-line bg-[rgb(var(--sheet))]/95 p-1.5 font-sans text-xs shadow-soft backdrop-blur lg:hidden" dir="ltr" aria-label="Reader controls">
        <Link aria-label="Previous page" className="flex min-h-12 items-center justify-center rounded-xl border border-line text-ink" href={prevHref}><ChevronLeft size={22} /></Link>
        <button aria-label="Table of contents" type="button" onClick={() => setPanel(panel === "toc" ? null : "toc")} className="flex min-h-12 items-center justify-center rounded-xl text-ink"><List size={21} /></button>
        <button aria-label={bookmarked ? "Remove bookmark" : "Bookmark page"} type="button" onClick={toggleBookmark} className={`flex min-h-12 items-center justify-center rounded-xl ${bookmarked ? "bg-accent text-paper" : "text-ink"}`}>{bookmarked ? <Check size={21} /> : <Bookmark size={21} />}</button>
        <button aria-label="Reader tools" type="button" onClick={() => setPanel(panel === "tools" ? null : "tools")} className="flex min-h-12 items-center justify-center rounded-xl text-ink"><SlidersHorizontal size={21} /></button>
        <Link aria-label="Next page" className="flex min-h-12 items-center justify-center rounded-xl bg-ink text-paper" href={nextHref}><ChevronRight size={22} /></Link>
        <button aria-label="Reader settings" type="button" onClick={() => setPanel(panel === "settings" ? null : "settings")} className="absolute -top-14 right-2 flex min-h-11 min-w-11 items-center justify-center rounded-full border border-line bg-[rgb(var(--sheet))]/95 text-ink shadow-soft"><Type size={20} /></button>
      </nav>
    </>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: ReadonlyArray<readonly [string, string]>; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-muted">{label}</span>
      <select value={value} onChange={(event) => onChange(event.currentTarget.value)} className="min-h-11 w-full rounded-xl border border-line bg-paper px-3 text-ink outline-none">
        {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
      </select>
    </label>
  );
}

function panelTitle(panel: Exclude<Panel, null>) {
  if (panel === "toc") return "Table of contents";
  if (panel === "settings") return "Reader settings";
  return "Tools";
}
