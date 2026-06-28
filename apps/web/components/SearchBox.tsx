"use client";

import { Check, ChevronDown } from "lucide-react";
import { useCallback, useRef, useState } from "react";

export type SearchMode = "all" | "text" | "books";

export type SearchBoxAdvanced = {
  limit?: number;
  strictVolume?: boolean;
  exact?: boolean;
  matchAll?: boolean;
  showStrictVolume?: boolean;
};

const modeOptions = [
  ["all", "Everything"],
  ["text", "Text only"],
  ["books", "Books/authors"],
] as const;

const sourceOptions = [
  ["all", "All sources"],
  ["ablibrary", "ABLibrary"],
  ["eshia", "eShia"],
  ["rafed", "Rafed"],
  ["thaqalayn", "Thaqalayn"],
] as const;

const limitOptions = [
  ["10", "10"],
  ["25", "25"],
  ["50", "50"],
  ["100", "100"],
  ["200", "200"],
  ["all", "All from source"],
] as const;

export function SearchBox({
  defaultValue = "",
  action = "/search",
  placeholder = "Search libraries...",
  hiddenFields = {},
  defaultSource = "all",
  defaultMode = "all",
  showMode = true,
  advanced,
  softDefault = false,
}: {
  defaultValue?: string;
  action?: string;
  placeholder?: string;
  hiddenFields?: Record<string, string | undefined>;
  defaultSource?: string;
  defaultMode?: SearchMode;
  showMode?: boolean;
  advanced?: SearchBoxAdvanced;
  softDefault?: boolean;
}) {
  const [softSeed, setSoftSeed] = useState(Boolean(softDefault && defaultValue));

  return (
    <form action={action} className="relative overflow-visible rounded-2xl border border-line/80 bg-paper/90 p-2.5 shadow-sm backdrop-blur" dir="ltr">
      {Object.entries(hiddenFields).map(([name, value]) => value ? <input key={name} type="hidden" name={name} value={value} /> : null)}
      {!showMode && <input type="hidden" name="mode" value={defaultMode} />}
      {advanced && <input type="hidden" name="page" value="1" />}
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          name="q"
          defaultValue={defaultValue}
          placeholder={placeholder}
          onFocus={() => setSoftSeed(false)}
          onChange={() => setSoftSeed(false)}
          className={`min-h-12 flex-1 rounded-xl border border-line/70 bg-[rgb(var(--sheet))]/70 px-3 font-sans outline-none placeholder:text-muted transition focus:border-accent/70 focus:bg-[rgb(var(--sheet))] focus:ring-2 focus:ring-accent/15 ${softSeed ? "text-sm text-muted/70 opacity-80" : "text-base text-ink opacity-100"}`}
        />
        {showMode && <FieldSelect name="mode" value={defaultMode} options={modeOptions} ariaLabel="Search type" />}
        <FieldSelect name="source" value={defaultSource} options={sourceOptions} ariaLabel="Source" />
        <button className="min-h-12 rounded-xl bg-ink px-5 font-sans text-xs font-semibold text-paper transition hover:opacity-90 sm:mb-0">Search</button>
      </div>
      {advanced && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line/70 pb-1 pt-3 font-sans text-xs text-muted">
          <span>Results</span>
          <FieldSelect name="limit" value={advanced.limit === 0 ? "all" : String(advanced.limit ?? 25)} options={limitOptions} ariaLabel="Result count" compact />
          {advanced.showStrictVolume && <CheckField name="strictVolume" label="strict volume" defaultChecked={advanced.strictVolume} />}
          <CheckField name="exact" label="exact phrase" defaultChecked={advanced.exact} />
          <CheckField name="matchAll" label="all words" defaultChecked={advanced.matchAll} />
        </div>
      )}
    </form>
  );
}

function FieldSelect({ name, value, options, ariaLabel, compact = false }: { name: string; value: string; options: ReadonlyArray<readonly [string, string]>; ariaLabel: string; compact?: boolean }) {
  const [selected, setSelected] = useState(value);
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);
  const label = options.find(([optionValue]) => optionValue === selected)?.[1] ?? selected;

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!open) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setOpen(true);
        setFocusIndex(Math.max(0, options.findIndex(([v]) => v === selected)));
      }
      return;
    }
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setFocusIndex((i) => Math.min(options.length - 1, i + 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setFocusIndex((i) => Math.max(0, i - 1));
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (focusIndex >= 0 && focusIndex < options.length) {
          setSelected(options[focusIndex][0]);
          setOpen(false);
        }
        break;
      case "Escape":
        event.preventDefault();
        setOpen(false);
        break;
    }
  }, [open, focusIndex, options, selected]);

  return (
    <div className={`relative min-w-0 ${open ? "z-50" : "z-10"}`} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) { setOpen(false); setFocusIndex(-1); }
    }}>
      <input type="hidden" name={name} value={selected} />
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => {
          setOpen((current) => {
            if (!current) setFocusIndex(Math.max(0, options.findIndex(([v]) => v === selected)));
            else setFocusIndex(-1);
            return !current;
          });
        }}
        onKeyDown={handleKeyDown}
        className={`${compact ? "min-h-9 px-3" : "min-h-12 px-3 sm:min-w-32"} inline-flex w-full items-center justify-between gap-2 rounded-xl border border-line bg-[rgb(var(--sheet))]/70 font-sans text-xs text-ink outline-none transition hover:border-accent/50 focus:border-accent/70 focus:ring-2 focus:ring-accent/15`}
      >
        <span className="truncate">{label}</span>
        <ChevronDown size={15} className={`shrink-0 text-muted transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div ref={listRef} role="listbox" className="relative z-50 mt-1 w-full overflow-hidden rounded-xl border border-line bg-[rgb(var(--sheet))] p-1 shadow-soft sm:absolute sm:left-0 sm:top-[calc(100%+.35rem)] sm:mt-0 sm:w-max sm:min-w-full">
          {options.map(([optionValue, optionLabel], index) => {
            const active = optionValue === selected;
            const focused = index === focusIndex;
            return (
              <button
                key={optionValue}
                type="button"
                role="option"
                aria-selected={active}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setSelected(optionValue);
                  setOpen(false);
                  setFocusIndex(-1);
                }}
                onMouseEnter={() => setFocusIndex(index)}
                className={`flex min-h-9 w-full items-center justify-between gap-3 rounded-lg px-3 text-left font-sans text-xs ${active ? "bg-accent/20 text-ink" : focused ? "bg-ink/5 text-ink" : "text-muted hover:bg-ink/5 hover:text-ink"}`}
              >
                <span className="whitespace-nowrap">{optionLabel}</span>
                {active && <Check size={14} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CheckField({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="inline-flex min-h-9 items-center gap-2 rounded-full border border-line/70 bg-[rgb(var(--sheet))]/45 px-3 text-muted transition hover:text-ink">
      <input name={name} type="checkbox" value="1" defaultChecked={defaultChecked} className="h-4 w-4 accent-[rgb(var(--accent))]" />
      {label}
    </label>
  );
}
