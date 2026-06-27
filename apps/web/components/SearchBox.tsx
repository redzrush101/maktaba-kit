export type SearchMode = "all" | "text" | "books";

export type SearchBoxAdvanced = {
  limit?: number;
  strictVolume?: boolean;
  exact?: boolean;
  matchAll?: boolean;
  showStrictVolume?: boolean;
};

export function SearchBox({
  defaultValue = "",
  action = "/search",
  placeholder = "Search libraries...",
  hiddenFields = {},
  defaultSource = "all",
  defaultMode = "all",
  showMode = true,
  advanced,
}: {
  defaultValue?: string;
  action?: string;
  placeholder?: string;
  hiddenFields?: Record<string, string | undefined>;
  defaultSource?: string;
  defaultMode?: SearchMode;
  showMode?: boolean;
  advanced?: SearchBoxAdvanced;
}) {
  return (
    <form action={action} className="rounded-xl border border-line/80 bg-paper/85 p-1.5 shadow-sm backdrop-blur" dir="ltr">
      {Object.entries(hiddenFields).map(([name, value]) => value ? <input key={name} type="hidden" name={name} value={value} /> : null)}
      {!showMode && <input type="hidden" name="mode" value={defaultMode} />}
      {advanced && <input type="hidden" name="page" value="1" />}
      <div className="flex flex-col gap-1.5 sm:flex-row">
        <input
          name="q"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="min-h-10 flex-1 rounded-lg bg-transparent px-2.5 font-sans text-base text-ink outline-none placeholder:text-muted"
        />
        {showMode && (
          <select name="mode" defaultValue={defaultMode} className="min-h-10 rounded-lg border border-line bg-paper px-2 font-sans text-[11px] text-muted outline-none" aria-label="Search type">
            <option value="all">Everything</option>
            <option value="text">Text only</option>
            <option value="books">Books/authors</option>
          </select>
        )}
        <select name="source" defaultValue={defaultSource} className="min-h-10 rounded-lg border border-line bg-paper px-2 font-sans text-[11px] text-muted outline-none" aria-label="Source">
          <option value="all">All sources</option>
          <option value="ablibrary">ABLibrary</option>
          <option value="eshia">eShia</option>
        </select>
        <button className="min-h-10 rounded-lg bg-ink px-4 font-sans text-xs font-semibold text-paper transition hover:opacity-90">Search</button>
      </div>
      {advanced && (
        <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-line/70 pt-2 font-sans text-xs text-muted">
          <label>Results</label>
          <select name="limit" defaultValue={advanced.limit === 0 ? "all" : String(advanced.limit ?? 25)} className="rounded-lg border border-line bg-paper px-2 py-1 outline-none">
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="200">200</option>
            <option value="all">All from source</option>
          </select>
          {advanced.showStrictVolume && <label className="inline-flex items-center gap-1"><input type="checkbox" name="strictVolume" value="1" defaultChecked={advanced.strictVolume} /> strict volume</label>}
          <label className="inline-flex items-center gap-1"><input type="checkbox" name="exact" value="1" defaultChecked={advanced.exact} /> exact phrase</label>
          <label className="inline-flex items-center gap-1"><input type="checkbox" name="matchAll" value="1" defaultChecked={advanced.matchAll} /> all words</label>
        </div>
      )}
    </form>
  );
}
