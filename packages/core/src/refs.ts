import type { SourceName } from "./models";

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
    if (ref.includes("ablibrary")) {
      const m = ref.match(/books\/(\d+)/);
      const p = ref.match(/[?&]page=(\d+)/);
      if (m) return { source: "ablibrary", bookId: m[1], page: p ? Number(p[1]) : undefined };
    }
  }

  let source: SourceName | undefined;
  if (ref.includes(":")) {
    const [src, rest] = ref.split(":", 2);
    if (src === "eshia" || src === "ablibrary") source = src;
    ref = rest;
  }

  const parts = ref.split("/").filter(Boolean);
  if (!parts.length) throw new Error("Invalid reference");
  if (source === "eshia" || (!source && parts.length >= 3)) {
    return { source: "eshia", bookId: parts[0], volume: parts[1] ?? "1", page: parts[2] ? Number(parts[2]) : undefined };
  }
  return { source: "ablibrary", bookId: parts[0], page: parts[1] ? Number(parts[1]) : undefined };
}

export function readerPath(ref: ReadPathInput) {
  if (ref.source === "eshia") return `/read/eshia/${ref.bookId}/${ref.volume ?? "1"}/${ref.page ?? 1}`;
  return `/read/ablibrary/${ref.bookId}/${ref.page ?? 1}`;
}

export function bookPath(ref: BookPathInput) {
  const params = ref.source === "eshia" && ref.volume ? `?volume=${encodeURIComponent(ref.volume)}` : "";
  return `/books/${ref.source}/${ref.bookId}${params}`;
}
