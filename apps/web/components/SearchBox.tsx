export function SearchBox({ defaultValue = "", action = "/search", placeholder = "Search libraries...", hiddenFields = {}, defaultSource = "all" }: { defaultValue?: string; action?: string; placeholder?: string; hiddenFields?: Record<string, string | undefined>; defaultSource?: string }) {
  return (
    <form action={action} className="flex flex-col gap-1.5 rounded-xl border border-line/80 bg-paper/85 p-1.5 shadow-sm backdrop-blur sm:flex-row" dir="ltr">
      {Object.entries(hiddenFields).map(([name, value]) => value ? <input key={name} type="hidden" name={name} value={value} /> : null)}
      <input
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="min-h-9 flex-1 rounded-lg bg-transparent px-2.5 font-sans text-base outline-none placeholder:text-muted"
      />
      <select name="source" defaultValue={defaultSource} className="rounded-lg border border-line bg-paper px-2 font-sans text-[11px] text-muted outline-none">
        <option value="all">All sources</option>
        <option value="ablibrary">ABLibrary</option>
        <option value="eshia">eShia</option>
      </select>
      <button className="rounded-lg bg-ink px-4 py-2 font-sans text-xs font-semibold text-paper transition hover:opacity-90">Search</button>
    </form>
  );
}
