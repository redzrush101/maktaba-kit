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

export const readerSettingsStorageKey = "maktaba-reader-settings";

export function useReaderSettings() {
  const [settings, setSettings] = useState<ReaderSettingsState>(readerSettingsDefaults);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(readerSettingsStorageKey);
    if (saved) {
      try {
        setSettings(parseReaderSettings(JSON.parse(saved)));
      } catch {
        window.localStorage.removeItem(readerSettingsStorageKey);
      }
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    applyReaderSettings(settings);
    if (loaded) window.localStorage.setItem(readerSettingsStorageKey, JSON.stringify(settings));
  }, [loaded, settings]);

  function update<K extends ReaderSettingsKey>(name: K, value: ReaderSettingsState[K]) {
    setSettings((current) => ({ ...current, [name]: value }));
  }

  return { settings, update };
}

export function applyReaderSettings(settings: ReaderSettingsState) {
  const root = document.documentElement;
  root.classList.toggle("light", settings.theme === "light");
  root.classList.toggle("sepia", settings.theme === "sepia");
  root.dataset.readerSize = settings.size;
  root.dataset.readerLeading = settings.leading;
  root.dataset.readerWidth = settings.width;
  root.dataset.readerColumns = settings.columns;
  root.dataset.readerFont = settings.font;
}

function parseReaderSettings(value: unknown): ReaderSettingsState {
  const input = value && typeof value === "object" ? value as Partial<Record<ReaderSettingsKey, unknown>> : {};
  return {
    theme: optionValue("theme", input.theme),
    size: optionValue("size", input.size),
    leading: optionValue("leading", input.leading),
    width: optionValue("width", input.width),
    columns: optionValue("columns", input.columns),
    font: optionValue("font", input.font),
  };
}

function optionValue<K extends ReaderSettingsKey>(key: K, value: unknown): ReaderSettingsState[K] {
  const allowed = readerSettingsOptions[key].map(([option]) => option);
  return (typeof value === "string" && (allowed as readonly string[]).includes(value) ? value : readerSettingsDefaults[key]) as ReaderSettingsState[K];
}
