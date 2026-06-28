import type { SourceSelect } from "@maktaba-kit/core/client";

const sources = new Set<SourceSelect>(["all", "ablibrary", "eshia", "thaqalayn"]);

export type SearchMode = "all" | "text" | "books";

export function sourceParamValue(value: string | undefined | null): SourceSelect {
  return sources.has(value as SourceSelect) ? (value as SourceSelect) : "all";
}

export function sourceParam(url: URL): SourceSelect {
  return sourceParamValue(url.searchParams.get("source"));
}

export function parseMode(value: string | undefined | null): SearchMode {
  return value === "text" || value === "books" || value === "all" ? value : "all";
}

export function parsePositiveInt(value: string | undefined | null, fallback: number) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : fallback;
}

export function positiveIntParam(url: URL, name: string, fallback: number) {
  return parsePositiveInt(url.searchParams.get(name), fallback);
}

export function parseLimit(value: string | undefined | null, fallback: number, max: number, min = 1) {
  if (value === "all") return 0;
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export function limitParam(url: URL, fallback: number, max?: number) {
  const parsed = parseLimit(url.searchParams.get("limit"), fallback, max ?? Number.MAX_SAFE_INTEGER);
  return parsed === 0 ? 0 : parsed;
}
