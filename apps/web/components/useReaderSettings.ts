"use client";

import { useEffect, useState } from "react";

export type ReaderSettingsState = {
  theme: "night" | "light" | "sepia";
  size: "sm" | "md" | "lg" | "xl";
  leading: "compact" | "comfortable" | "spacious";
  width: "narrow" | "normal" | "wide";
  columns: "single" | "auto" | "double";
  font: "amiri" | "serif" | "sans";
};

export type ReaderSettingsKey = keyof ReaderSettingsState;

export const readerSettingsDefaults: ReaderSettingsState = {
  theme: "night",
  size: "md",
  leading: "comfortable",
  width: "normal",
  columns: "auto",
  font: "amiri",
};

export const readerSettingsOptions = {
  theme: [["night", "Night"], ["light", "Light"], ["sepia", "Sepia"]],
  size: [["sm", "Small"], ["md", "Medium"], ["lg", "Large"], ["xl", "XL"]],
  leading: [["compact", "Compact"], ["comfortable", "Comfort"], ["spacious", "Spacious"]],
  width: [["narrow", "Narrow"], ["normal", "Normal"], ["wide", "Wide"]],
  columns: [["single", "Single"], ["auto", "Auto"], ["double", "Double"]],
  font: [["amiri", "Amiri"], ["serif", "Serif"], ["sans", "Sans"]],
} as const;

const storageKey = "maktaba-reader-settings";

export function useReaderSettings() {
  const [settings, setSettings] = useState<ReaderSettingsState>(readerSettingsDefaults);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return;
    try {
      setSettings({ ...readerSettingsDefaults, ...JSON.parse(saved) });
    } catch {
      window.localStorage.removeItem(storageKey);
    }
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
    window.localStorage.setItem(storageKey, JSON.stringify(settings));
  }, [settings]);

  function update<K extends ReaderSettingsKey>(name: K, value: ReaderSettingsState[K]) {
    setSettings((current) => ({ ...current, [name]: value }));
  }

  return { settings, update };
}
