export type LibraryItem = {
  ref: string;
  source: "ablibrary" | "eshia" | "thaqalayn";
  bookId: string;
  volume?: string;
  page: number;
  title?: string;
  author?: string;
  url: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export const bookmarksKey = "maktaba-bookmarks";
export const recentKey = "maktaba-recent";

export function readItems(key: string): LibraryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isLibraryItem) : [];
  } catch {
    window.localStorage.removeItem(key);
    return [];
  }
}

export function writeItems(key: string, items: LibraryItem[]) {
  window.localStorage.setItem(key, JSON.stringify(items));
}

export function upsertItem(key: string, item: Omit<LibraryItem, "createdAt" | "updatedAt">, limit = 100) {
  const now = new Date().toISOString();
  const current = readItems(key);
  const existing = current.find((entry) => entry.ref === item.ref);
  const next: LibraryItem = { ...item, createdAt: existing?.createdAt ?? now, updatedAt: now };
  writeItems(key, [next, ...current.filter((entry) => entry.ref !== item.ref)].slice(0, limit));
  return next;
}

export function removeItem(key: string, ref: string) {
  writeItems(key, readItems(key).filter((item) => item.ref !== ref));
}

function isLibraryItem(value: unknown): value is LibraryItem {
  return Boolean(value && typeof value === "object" && "ref" in value && "url" in value);
}
