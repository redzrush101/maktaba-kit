import { MemoryCache } from "./cache";
import { HttpClient } from "./http";
import type { ApiResponse, Book, Page, SearchOptions, SearchResult, SourceError, SourceName, SourceSelect, TocItem } from "./models";
import { parseRef } from "./refs";
import { AblibrarySource } from "./sources/ablibrary";
import { EshiaSource } from "./sources/eshia";

export * from "./models";
export * from "./refs";

export type MaktabaClientOptions = { timeoutMs?: number; ttlMs?: number; userAgent?: string; cache?: boolean };

type Source = AblibrarySource | EshiaSource;

export class MaktabaClient {
  private ablibrary: AblibrarySource;
  private eshia: EshiaSource;

  constructor(options: MaktabaClientOptions = {}) {
    const cache = new MemoryCache(options.ttlMs ?? 86_400_000, options.cache ?? true);
    const http = new HttpClient(cache, options.timeoutMs ?? 20_000, options.userAgent ?? "Mozilla/5.0 MaktabaKit/0.1");
    this.ablibrary = new AblibrarySource(http);
    this.eshia = new EshiaSource(http);
  }

  private selected(source: SourceSelect = "all"): Source[] {
    if (source === "ablibrary") return [this.ablibrary];
    if (source === "eshia") return [this.eshia];
    return [this.ablibrary, this.eshia];
  }

  private async many<T>(source: SourceSelect, fn: (s: Source) => Promise<T[] | T>): Promise<{ data: T[]; errors: SourceError[] }> {
    const data: T[] = [];
    const errors: SourceError[] = [];
    await Promise.all(this.selected(source).map(async (s) => {
      try {
        const res = await fn(s);
        if (Array.isArray(res)) data.push(...res);
        else data.push(res);
      } catch (e) {
        errors.push({ source: s.name as SourceName, code: e instanceof Error ? e.name : "Error", message: e instanceof Error ? e.message : String(e) });
      }
    }));
    return { data, errors };
  }

  async search(query: string, options: SearchOptions = {}): Promise<ApiResponse<SearchResult[]>> {
    const limit = options.limit ?? 10;
    const { data, errors } = await this.many<SearchResult>(options.source ?? "all", (s) => s.search(query, limit, options.page ?? 1, options.bookId));
    let out = options.volume ? data.filter((r) => String(r.volume ?? "") === String(options.volume)) : data;
    if (options.exact) out = out.filter((r) => [r.snippet, r.bookTitle].filter(Boolean).join(" ").includes(query));
    out = out.map((r) => ({ ...r, snippet: trim(r.snippet, options.context ?? 320, query) }));
    return { ok: !errors.length || out.length > 0, data: out, errors, query };
  }

  async books(query: string, options: SearchOptions = {}): Promise<ApiResponse<Book[]>> {
    const { data, errors } = await this.many<Book>(options.source ?? "all", (s) => s.books(query, options.limit ?? 10, options.page ?? 1));
    return { ok: !errors.length || data.length > 0, data, errors, query };
  }

  async read(ref: string): Promise<ApiResponse<Page[]>> {
    const r = parseRef(ref);
    const src = r.source === "ablibrary" ? this.ablibrary : this.eshia;
    const pages = [r.page ?? 1];
    try {
      const data = r.source === "eshia" ? await this.eshia.read(r.bookId, pages, r.volume ?? "1") : await this.ablibrary.read(r.bookId, pages);
      return { ok: true, data, errors: [] };
    } catch (e) {
      return { ok: false, data: [], errors: [{ source: src.name, code: e instanceof Error ? e.name : "Error", message: e instanceof Error ? e.message : String(e) }] };
    }
  }

  async info(ref: string): Promise<ApiResponse<Book[]>> {
    const r = parseRef(ref);
    try {
      const data = [r.source === "eshia" ? await this.eshia.info(r.bookId, r.volume ?? "1") : await this.ablibrary.info(r.bookId)];
      return { ok: true, data, errors: [] };
    } catch (e) {
      return { ok: false, data: [], errors: [{ source: r.source, code: e instanceof Error ? e.name : "Error", message: e instanceof Error ? e.message : String(e) }] };
    }
  }

  async toc(ref: string, limit = 100): Promise<ApiResponse<TocItem[]>> {
    const r = parseRef(ref);
    try {
      const data = r.source === "eshia" ? await this.eshia.toc(r.bookId, r.volume ?? "1", limit) : await this.ablibrary.toc(r.bookId, limit);
      return { ok: true, data, errors: [] };
    } catch (e) {
      return { ok: false, data: [], errors: [{ source: r.source, code: e instanceof Error ? e.name : "Error", message: e instanceof Error ? e.message : String(e) }] };
    }
  }

  async suggest(query: string, options: SearchOptions = {}) {
    return this.many(options.source ?? "all", (s) => s.suggest(query, options.limit ?? 10));
  }
}

export function createMaktabaClient(options?: MaktabaClientOptions) {
  return new MaktabaClient(options);
}

function trim(text: string | undefined, n: number, needle?: string) {
  if (!text || text.length <= n) return text;
  const compact = text.replace(/\s+/g, " ").trim();
  const idx = needle ? compact.indexOf(needle) : -1;
  const start = idx > 0 ? Math.max(0, idx - Math.floor(n / 3)) : 0;
  const out = compact.slice(start, start + n);
  return `${start ? "…" : ""}${out}${start + n < compact.length ? "…" : ""}`;
}
