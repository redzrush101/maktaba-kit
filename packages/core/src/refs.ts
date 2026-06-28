import type { SourceName } from "./models";

export function normalizeSource(value: string | undefined): SourceName {
  return value === "eshia" || value === "thaqalayn" || value === "rafed" ? value : "ablibrary";
}

export function readerRefFromParts(source: string, parts: string[]): ParsedRef {
  const sourceName = normalizeSource(source);
  const bookId = sourceName === "thaqalayn" ? parts.slice(0, -1).join("/") : parts[0];
  const volume = sourceName === "eshia" ? parts[1] ?? "1" : undefined;
  const page = Number(sourceName === "eshia" || sourceName === "rafed" ? parts[1] ?? "1" : parts.at(-1) ?? "1");
  return { source: sourceName, bookId, volume, page };
}

export function refString(ref: ParsedRef) {
  if (ref.source === "eshia") return `eshia:${ref.bookId}/${ref.volume ?? "1"}/${ref.page ?? 1}`;
  if (ref.source === "thaqalayn") return `thaqalayn:${ref.bookId}/${ref.page ?? 1}`;
  if (ref.source === "rafed") return `rafed:${ref.bookId}/${ref.page ?? 1}`;
  return `ablibrary:${ref.bookId}/${ref.page ?? 1}`;
}

export type ParsedRef = { source: SourceName; bookId: string; volume?: string; page?: number };
export type ReadPathInput = ParsedRef;
export type BookPathInput = Pick<ParsedRef, "source" | "bookId" | "volume">;

export function parseRef(input: string): ParsedRef {
  let ref = input.trim();
  if (ref.startsWith("http")) {
    if (ref.includes("lib.eshia.ir")) {
      const m = ref.match(/lib\.eshia\.ir\/(\d+)\/(\d+)\/(\d+)/);
      if (m) return { source: "eshia", bookId: m[1], volume: m[2], page: Number(m[3]) };
    }
    if (ref.includes("thaqalayn.net")) {
      const m = ref.match(/thaqalayn\.net\/hadith\/(\d+)\/(\d+)\/(\d+)\/(\d+)/);
      if (m) return { source: "thaqalayn", bookId: `${m[1]}/${m[2]}/${m[3]}`, page: Number(m[4]) };
      const b = ref.match(/thaqalayn\.net\/book\/(\d+)/);
      if (b) return { source: "thaqalayn", bookId: b[1], page: 1 };
    }
    if (ref.includes("ablibrary")) {
      const m = ref.match(/books\/(\d+)/);
      const p = ref.match(/[?&]page=(\d+)/);
      if (m) return { source: "ablibrary", bookId: m[1], page: p ? Number(p[1]) : undefined };
    }
    if (ref.includes("lib.rafed.net")) {
      const m = ref.match(/b_id=(\d+)/);
      const p = ref.match(/[?&]page=(\d+)/);
      if (m) return { source: "rafed", bookId: m[1], page: p ? Number(p[1]) : undefined };
    }
  }

  let source: SourceName | undefined;
  if (ref.includes(":")) {
    const [src, rest] = ref.split(":", 2);
    if (src === "eshia" || src === "ablibrary" || src === "thaqalayn" || src === "rafed") source = src;
    ref = rest;
  }

  const parts = ref.split("/").filter(Boolean);
  if (!parts.length) throw new Error("Invalid reference");
  if (source === "thaqalayn") {
    if (parts.length >= 4) return { source, bookId: parts.slice(0, -1).join("/"), page: Number(parts.at(-1) ?? 1) };
    return { source, bookId: parts.join("/"), page: undefined };
  }
  if (source === "rafed" || source === "eshia" || (!source && parts.length >= 3)) {
    if (source === "rafed") return { source, bookId: parts[0], page: parts[1] ? Number(parts[1]) : undefined };
    if (source === "eshia") return { source, bookId: parts[0], volume: parts[1] ?? "1", page: parts[2] ? Number(parts[2]) : undefined };
  }
  return { source: "ablibrary", bookId: parts[0], page: parts[1] ? Number(parts[1]) : undefined };
}

export function readerPath(ref: ReadPathInput) {
  if (ref.source === "eshia") return `/read/eshia/${ref.bookId}/${ref.volume ?? "1"}/${ref.page ?? 1}`;
  if (ref.source === "thaqalayn") return `/read/thaqalayn/${ref.bookId}/${ref.page ?? 1}`;
  if (ref.source === "rafed") return `/read/rafed/${ref.bookId}/${ref.page ?? 1}`;
  return `/read/ablibrary/${ref.bookId}/${ref.page ?? 1}`;
}

export function bookPath(ref: BookPathInput) {
  const params = ref.source === "eshia" && ref.volume ? `?volume=${encodeURIComponent(ref.volume)}` : "";
  return `/books/${ref.source}/${ref.bookId}${params}`;
}
