import { MemoryCache } from "./cache";
import { HttpClient } from "./http";
import type { ApiResponse, Book, LibrarySource, Page, SearchOptions, SearchResult, SourceError, SourceName, SourceSelect, TocItem } from "./models";
import { parseRef } from "./refs";
import { AblibrarySource } from "./sources/ablibrary";
import { EshiaSource } from "./sources/eshia";

export * from "./cache";
export * from "./models";
export * from "./refs";

export type MaktabaClientOptions = { timeoutMs?: number; ttlMs?: number; userAgent?: string; cache?: boolean; maxCacheEntries?: number };

export class MaktabaClient {
  private sources: Record<SourceName, LibrarySource>;

  constructor(options: MaktabaClientOptions = {}) {
    const cache = new MemoryCache(options.ttlMs ?? 86_400_000, options.cache ?? true, options.maxCacheEntries ?? 500);
    const http = new HttpClient(cache, options.timeoutMs ?? 20_000, options.userAgent ?? "Mozilla/5.0 MaktabaKit/0.1");
    this.sources = {
      ablibrary: new AblibrarySource(http),
      eshia: new EshiaSource(http),
    };
  }

  private selected(source: SourceSelect = "all"): LibrarySource[] {
    if (source === "all") return Object.values(this.sources);
    return [this.sources[source]];
  }

  private async many<T>(source: SourceSelect, fn: (s: LibrarySource) => Promise<T[] | T>): Promise<{ data: T[]; errors: SourceError[] }> {
    const data: T[] = [];
    const errors: SourceError[] = [];
    await Promise.all(this.selected(source).map(async (s) => {
      try {
        const res = await fn(s);
        if (Array.isArray(res)) data.push(...res);
        else data.push(res);
      } catch (e) {
        errors.push(toSourceError(s.name, e));
      }
    }));
    return { data, errors };
  }

  async search(query: string, options: SearchOptions = {}): Promise<ApiResponse<SearchResult[]>> {
    const cleanQuery = query.trim();
    const limit = options.limit ?? 10;
    const wantsAll = limit <= 0;
    const fetchLimit = wantsAll ? 0 : (options.volume ? Math.max(limit, 50) : limit);
    const { data, errors } = await this.many<SearchResult>(options.source ?? "all", (s) => s.search(cleanQuery, fetchLimit, options.page ?? 1, options.bookId));
    const volumeFiltered = options.volume ? data.filter((r) => String(r.volume ?? "") === String(options.volume)) : data;
    let out = options.volume && (volumeFiltered.length || options.strictVolume) ? volumeFiltered : data;
    if (!wantsAll) out = out.slice(0, limit);
    if (options.exact) out = out.filter((r) => [r.snippet, r.bookTitle].filter(Boolean).join(" ").includes(cleanQuery));
    out = out.map((r) => ({ ...r, snippet: trim(r.snippet, options.context ?? 320, cleanQuery) }));
    return { ok: !errors.length || out.length > 0, data: out, errors, query: cleanQuery };
  }

  async books(query: string, options: SearchOptions = {}): Promise<ApiResponse<Book[]>> {
    const { data, errors } = await this.many<Book>(options.source ?? "all", (s) => s.books(query, options.limit ?? 10, options.page ?? 1));
    return { ok: !errors.length || data.length > 0, data, errors, query };
  }

  async read(ref: string): Promise<ApiResponse<Page[]>> {
    const r = parseRef(ref);
    const src = this.sources[r.source];
    const pages = [r.page ?? 1];
    try {
      const data = r.source === "eshia" ? await src.read(r.bookId, pages, r.volume ?? "1") : await src.read(r.bookId, pages);
      return { ok: true, data, errors: [] };
    } catch (e) {
      return { ok: false, data: [], errors: [toSourceError(src.name, e)] };
    }
  }

  async info(ref: string): Promise<ApiResponse<Book[]>> {
    const r = parseRef(ref);
    const src = this.sources[r.source];
    try {
      const data = [r.source === "eshia" ? await src.info(r.bookId, r.volume ?? "1") : await src.info(r.bookId)];
      return { ok: true, data, errors: [] };
    } catch (e) {
      return { ok: false, data: [], errors: [toSourceError(r.source, e)] };
    }
  }

  async toc(ref: string, limit = 100): Promise<ApiResponse<TocItem[]>> {
    const r = parseRef(ref);
    const src = this.sources[r.source];
    try {
      const data = r.source === "eshia" ? await src.toc(r.bookId, r.volume ?? "1", limit) : await src.toc(r.bookId, limit);
      return { ok: true, data, errors: [] };
    } catch (e) {
      return { ok: false, data: [], errors: [toSourceError(r.source, e)] };
    }
  }

  async suggest(query: string, options: SearchOptions = {}) {
    return this.many(options.source ?? "all", (s) => s.suggest(query, options.limit ?? 10));
  }
}

export function createMaktabaClient(options?: MaktabaClientOptions) {
  return new MaktabaClient(options);
}

function toSourceError(source: SourceName, error: unknown): SourceError {
  return {
    source,
    code: error instanceof Error ? error.name : "Error",
    message: error instanceof Error ? error.message : String(error),
  };
}

function trim(text: string | undefined, n: number, needle?: string) {
  if (!text || text.length <= n) return text;
  const compact = text.replace(/\s+/g, " ").trim();
  const idx = needle ? compact.indexOf(needle) : -1;
  const start = idx > 0 ? Math.max(0, idx - Math.floor(n / 3)) : 0;
  const out = compact.slice(start, start + n);
  return `${start ? "…" : ""}${out}${start + n < compact.length ? "…" : ""}`;
}
