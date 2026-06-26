"use client";

import { useEffect, useState } from "react";

const defaults = {
  theme: "night",
  size: "md",
  leading: "comfortable",
  width: "normal",
  columns: "auto",
  font: "amiri",
};

type Settings = typeof defaults;

const options = {
  theme: [["night", "Night"], ["light", "Light"], ["sepia", "Sepia"]],
  size: [["sm", "Small"], ["md", "Medium"], ["lg", "Large"], ["xl", "XL"]],
  leading: [["compact", "Compact"], ["comfortable", "Comfort"], ["spacious", "Spacious"]],
  width: [["narrow", "Narrow"], ["normal", "Normal"], ["wide", "Wide"]],
  columns: [["single", "Single"], ["auto", "Auto"], ["double", "Double"]],
  font: [["amiri", "Amiri"], ["serif", "Serif"], ["sans", "Sans"]],
} as const;

export function ReaderSettings() {
  const [settings, setSettings] = useState<Settings>(defaults);

  useEffect(() => {
    const saved = window.localStorage.getItem("maktaba-reader-settings");
    if (saved) setSettings({ ...defaults, ...JSON.parse(saved) });
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("light", settings.theme === "light");
    root.classList.toggle("sepia", settings.theme === "sepia");
    root.dataset.readerSize = settings.size;
    root.dataset.readerLeading = settings.leading;
    root.dataset.readerWidth = settings.width;
    root.dataset.readerColumns = settings.columns;
    root.dataset.readerFont = settings.font;
    window.localStorage.setItem("maktaba-reader-settings", JSON.stringify(settings));
  }, [settings]);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  return (
    <details className="rounded-xl border border-line bg-[rgb(var(--sheet))]/80 p-3 font-sans text-xs text-muted shadow-sm">
      <summary className="cursor-pointer font-semibold text-ink">Reader settings</summary>
      <div className="mt-3 space-y-3" dir="ltr">
        {(Object.keys(options) as Array<keyof Settings>).map((key) => (
          <label key={key} className="block">
            <span className="mb-1 block capitalize">{key}</span>
            <select value={settings[key]} onChange={(e) => update(key, e.target.value as Settings[typeof key])} className="w-full rounded-lg border border-line bg-paper px-2 py-1.5 text-ink outline-none">
              {options[key].map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        ))}
      </div>
    </details>
  );
}
