"use client";

import { readerSettingsOptions, type ReaderSettingsKey, type ReaderSettingsState, useReaderSettings } from "./useReaderSettings";

export function ReaderSettings() {
  const { settings, update } = useReaderSettings();

  return (
    <details className="rounded-xl border border-line bg-[rgb(var(--sheet))]/80 p-3 font-sans text-xs text-muted shadow-sm">
      <summary className="cursor-pointer font-semibold text-ink">Reader settings</summary>
      <div className="mt-3 space-y-3" dir="ltr">
        {(Object.keys(readerSettingsOptions) as ReaderSettingsKey[]).map((key) => (
          <label key={key} className="block">
            <span className="mb-1 block capitalize">{key}</span>
            <select value={settings[key]} onChange={(e) => update(key, e.target.value as ReaderSettingsState[typeof key])} className="w-full rounded-lg border border-line bg-paper px-2 py-1.5 text-ink outline-none">
              {readerSettingsOptions[key].map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        ))}
      </div>
    </details>
  );
}
