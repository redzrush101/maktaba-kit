"use client";

import { useState } from "react";

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

  return (
    <>
      <input type="hidden" name={name} value={selected} />
      <select
        aria-label={ariaLabel}
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className={`${compact ? "min-h-9 px-3" : "min-h-12 px-3 sm:min-w-32"} w-full appearance-none rounded-xl border border-line bg-[rgb(var(--sheet))]/70 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2215%22%20height%3D%2215%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23999%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:15px] bg-[right_0.5rem_center] bg-no-repeat pr-8 font-sans text-xs text-ink outline-none transition hover:border-accent/50 focus:border-accent/70 focus:ring-2 focus:ring-accent/15`}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>{optionLabel}</option>
        ))}
      </select>
    </>
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
