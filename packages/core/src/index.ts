import { MemoryCache, type CacheStore } from "./cache";
import { HttpClient } from "./http";
import type { ApiResponse, Book, Category, CategoryBookOptions, LibrarySource, Page, SearchOptions, SearchResult, SourceError, SourceName, SourceSelect, TocItem } from "./models";
import { parseRef } from "./refs";
import { normalizeArabic, postProcessBooks, postProcessSearchResults } from "./search-utils";
import { AblibrarySource } from "./sources/ablibrary";
import { EshiaSource } from "./sources/eshia";
import { RafedSource } from "./sources/rafed";
import { ThaqalaynSource } from "./sources/thaqalayn";

export * from "./cache";
export * from "./models";
export * from "./refs";
export * from "./search-utils";
export * from "./source-utils";

export type { CategoryBookOptions } from "./models";

export type MaktabaClientOptions = { timeoutMs?: number; ttlMs?: number; userAgent?: string; cache?: boolean; maxCacheEntries?: number; cacheStore?: CacheStore };

export class MaktabaClient {
  private sources: Record<SourceName, LibrarySource>;

  constructor(options: MaktabaClientOptions = {}) {
    const cache = options.cacheStore ?? new MemoryCache(options.ttlMs ?? 86_400_000, options.cache ?? true, options.maxCacheEntries ?? 500);
    const http = new HttpClient(cache, options.timeoutMs ?? 20_000, options.userAgent ?? "Mozilla/5.0 MaktabaKit/0.1");
    this.sources = {
      ablibrary: new AblibrarySource(http),
      eshia: new EshiaSource(http),
      rafed: new RafedSource(http),
      thaqalayn: new ThaqalaynSource(http),
    };
  }

  private selected(source: SourceSelect = "all"): LibrarySource[] {
    if (source === "all" || !this.sources[source as SourceName]) return Object.values(this.sources);
    return [this.sources[source as SourceName]];
  }

  private async many<T>(source: SourceSelect, fn: (s: LibrarySource) => Promise<T[] | T>): Promise<{ data: T[]; errors: SourceError[] }> {
    const results = await Promise.all(this.selected(source).map(async (s) => {
      try {
        const res = await fn(s);
        return { data: Array.isArray(res) ? res : [res], errors: [] as SourceError[] };
      } catch (e) {
        return { data: [] as T[], errors: [toSourceError(s.name, e)] };
      }
    }));
    return {
      data: results.flatMap((result) => result.data),
      errors: results.flatMap((result) => result.errors),
    };
  }

  async search(query: string, options: SearchOptions = {}): Promise<ApiResponse<SearchResult[]>> {
    const cleanQuery = query.trim();
    const limit = options.limit ?? 10;
    const wantsAll = limit <= 0;
    const fetchLimit = wantsAll ? 0 : (options.volume ? Math.max(limit, 50) : limit);
    const primary = await this.many<SearchResult>(options.source ?? "all", (s) => s.search(cleanQuery, fetchLimit, options.page ?? 1, options.bookId));
    let data = primary.data;
    const errors = primary.errors;
    if (data.length < Math.min(3, limit || 3)) {
      const normalizedQuery = normalizeArabic(cleanQuery);
      if (normalizedQuery && normalizedQuery !== cleanQuery) {
        const fallback = await this.many<SearchResult>(options.source ?? "all", (s) => s.search(normalizedQuery, fetchLimit, options.page ?? 1, options.bookId));
        data = data.concat(fallback.data);
        errors.push(...fallback.errors);
      }
    }
    let out = postProcessSearchResults(data, cleanQuery, options);
    if (!wantsAll) out = out.slice(0, limit);
    out = out.map((r) => ({ ...r, snippet: trim(r.snippet, options.context ?? 320, cleanQuery) }));
    return apiResponse(out, errors, cleanQuery);
  }

  async books(query: string, options: SearchOptions = {}): Promise<ApiResponse<Book[]>> {
    const cleanQuery = query.trim();
    const { data, errors } = await this.many<Book>(options.source ?? "all", (s) => s.books(cleanQuery, options.limit ?? 10, options.page ?? 1));
    const out = postProcessBooks(data, cleanQuery, options);
    return apiResponse(out, errors, cleanQuery);
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

  async categories(sourceFilter?: SourceName): Promise<ApiResponse<Category[]>> {
    const source = sourceFilter ?? "all";
    const { data, errors } = await this.many<Category>(source, async (s) => {
      if (typeof s.categories !== "function") return [];
      return s.categories();
    });
    return apiResponse(data, errors);
  }

  async categoryBooks(categoryId: string, options: SearchOptions & CategoryBookOptions = {}): Promise<ApiResponse<Book[]>> {
    const sourceName = options.source && options.source !== "all" ? options.source as SourceName : "ablibrary";
    const src = this.sources[sourceName];
    if (!src || typeof src.categoryBooks !== "function") {
      return { ok: false, data: [], errors: [{ source: sourceName, code: "Unsupported", message: `Source ${sourceName} does not support category browsing` }], query: categoryId };
    }
    try {
      const data = await src.categoryBooks(categoryId, { limit: options.limit ?? 50, page: options.page ?? 1 });
      return { ok: true, data, errors: [], query: categoryId };
    } catch (e) {
      return { ok: false, data: [], errors: [toSourceError(sourceName, e)], query: categoryId };
    }
  }

  async suggest(query: string, options: SearchOptions = {}) {
    return this.many(options.source ?? "all", (s) => s.suggest(query, options.limit ?? 10));
  }
}

export function createMaktabaClient(options?: MaktabaClientOptions) {
  return new MaktabaClient(options);
}

function apiResponse<T>(data: T[], errors: SourceError[], query?: string): ApiResponse<T[]> {
  if (!errors.length || data.length > 0) return { ok: true, data, errors, query };
  return { ok: false, data: [], errors, query };
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
  const idx = needle ? normalizedIndexOf(compact, needle) : -1;
  const start = idx > 0 ? Math.max(0, idx - Math.floor(n / 3)) : 0;
  const out = compact.slice(start, start + n);
  return `${start ? "…" : ""}${out}${start + n < compact.length ? "…" : ""}`;
}

function normalizedIndexOf(text: string, needle: string) {
  const direct = text.indexOf(needle);
  if (direct >= 0) return direct;
  const normalizedNeedle = normalizeArabic(needle);
  if (!normalizedNeedle) return -1;
  const normalizedText = normalizeArabic(text);
  const normalizedIndex = normalizedText.indexOf(normalizedNeedle);
  if (normalizedIndex < 0) return -1;
  return Math.min(text.length - 1, normalizedIndex);
}
