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

const storageVersion = 1;
type StoredLibraryItems = { version: typeof storageVersion; items: LibraryItem[] };

export function readItems(key: string): LibraryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "[]") as unknown;
    const items = Array.isArray(parsed) ? parsed : isStoredLibraryItems(parsed) ? parsed.items : [];
    return items.filter(isLibraryItem);
  } catch {
    window.localStorage.removeItem(key);
    return [];
  }
}

export function writeItems(key: string, items: LibraryItem[]) {
  const payload: StoredLibraryItems = { version: storageVersion, items };
  window.localStorage.setItem(key, JSON.stringify(payload));
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

function isStoredLibraryItems(value: unknown): value is StoredLibraryItems {
  return Boolean(value && typeof value === "object" && (value as { version?: unknown }).version === storageVersion && Array.isArray((value as { items?: unknown }).items));
}

function isLibraryItem(value: unknown): value is LibraryItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Record<keyof LibraryItem, unknown>>;
  return typeof item.ref === "string"
    && (item.source === "ablibrary" || item.source === "eshia" || item.source === "thaqalayn")
    && typeof item.bookId === "string"
    && typeof item.page === "number"
    && typeof item.url === "string"
    && typeof item.createdAt === "string"
    && typeof item.updatedAt === "string"
    && (item.volume === undefined || typeof item.volume === "string")
    && (item.title === undefined || typeof item.title === "string")
    && (item.author === undefined || typeof item.author === "string")
    && (item.note === undefined || typeof item.note === "string");
}
