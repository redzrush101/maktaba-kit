import type { Book, Page, SearchResult, TocItem } from "../models";
import { HttpClient } from "../http";

type AnyObj = Record<string, any>;

export class AblibrarySource {
  name = "ablibrary" as const;
  base = "https://grpc.ablibrary.net";
  private headers: Record<string, string>;

  constructor(private http: HttpClient, lang = "ar") {
    this.headers = { "x-language-id": lang };
  }

  private async post(service: string, method: string, payload: AnyObj) {
    const res = await this.http.postJson(`${this.base}/${service}/${method}`, payload, this.headers);
    if (res.status >= 400) throw new Error(`HTTP ${res.status}: ${res.text.slice(0, 200)}`);
    const data = JSON.parse(res.text || "{}");
    if (data?.code) throw new Error(data.message ?? data.code);
    return data;
  }

  async books(query: string, limit = 10, page = 1, fuzzy = false): Promise<Book[]> {
    const payload: AnyObj = { query, page, perPage: limit };
    if (fuzzy) payload.fuzzy = { enabled: true, fields: ["FIELD_TITLE", "FIELD_CONTRIBUTOR_NAME", "FIELD_CATEGORY_NAME"] };
    const data = await this.post("ablibrary.services.book_service.BookService", "List", payload);
    return (data.books ?? []).slice(0, limit).map((b: AnyObj) => this.book(b));
  }

  async search(query: string, limit = 10, page = 1, bookId?: string): Promise<SearchResult[]> {
    if (bookId) {
      try {
        const data = await this.post("ablibrary.services.search_service.SearchService", "SearchInBook", { bookId, query, scope: ["SCOPE_TEXT"] });
        const pages = (data.abx ?? data.ocr ?? {}).pages ?? [];
        return pages.slice(0, limit).map((item: AnyObj) => {
          const p = item.page ?? item;
          return { source: this.name, kind: "text", bookId, page: p.number, snippet: this.flattenPage(p).slice(0, 600), url: `https://v4.ablibrary.net/books/${bookId}?page=${p.number}` };
        });
      } catch {
        return this.searchGlobal(query, limit, page, bookId);
      }
    }
    return this.searchGlobal(query, limit, page);
  }

  private async searchGlobal(query: string, limit = 10, page = 1, bookId?: string): Promise<SearchResult[]> {
    const payload: AnyObj = { query, paginate: { page, perPage: limit } };
    if (bookId) payload.books = [bookId];
    const data = await this.post("ablibrary.services.search_service.SearchService", "Search", payload);
    return (data.results ?? []).slice(0, limit).map((item: AnyObj) => {
      const book = item.book ?? {};
      const result = item.result ?? {};
      const p = ((result.abx ?? result.ocr ?? {}).page ?? {});
      return {
        source: this.name,
        kind: "text",
        bookId: book.id ? String(book.id) : undefined,
        bookTitle: book.title,
        author: this.author(book),
        page: p.number,
        snippet: p ? this.flattenPage(p).slice(0, 600) : undefined,
        url: book.id ? `https://v4.ablibrary.net/books/${book.id}${p.number ? `?page=${p.number}` : ""}` : undefined,
        hitCount: item.hitCount ?? item.hit_count,
      };
    });
  }

  async read(bookId: string, pages: number[]): Promise<Page[]> {
    const data = await this.post("ablibrary.services.book_service.BookService", "Contents", { bookId, pageNumbers: pages });
    return ((data.abx ?? data.ocr ?? {}).pages ?? []).map((p: AnyObj) => ({
      source: this.name,
      bookId,
      page: p.number,
      label: p.label,
      text: this.flattenPage(p),
      url: `https://v4.ablibrary.net/books/${bookId}?page=${p.number}`,
    }));
  }

  async info(bookId: string): Promise<Book> {
    const data = await this.post("ablibrary.services.book_service.BookService", "Details", { id: bookId });
    return this.book(data.book ?? {});
  }

  async toc(bookId: string, limit = 100): Promise<TocItem[]> {
    const data = await this.post("ablibrary.services.book_service.BookService", "TableOfContents", { bookId });
    return (data.items ?? []).slice(0, limit).map((i: AnyObj) => ({ source: this.name, bookId, title: i.title ?? "", page: i.pageNumber, url: `https://v4.ablibrary.net/books/${bookId}?page=${i.pageNumber}` }));
  }

  async suggest(query: string, limit = 10) {
    const data = await this.post("ablibrary.services.search_service.SearchService", "Suggest", { query, paginate: { page: 1, perPage: limit } });
    return (data.suggestions ?? []).slice(0, limit);
  }

  private book(b: AnyObj): Book {
    return { source: this.name, id: String(b.id ?? ""), title: b.title, author: this.author(b), volume: b.volumeLabel ?? (b.volumeNumber ? String(b.volumeNumber) : undefined), pages: b.pagesCount, url: b.id ? `https://v4.ablibrary.net/books/${b.id}` : undefined, meta: { source: b.source } };
  }

  private author(b: AnyObj): string | undefined {
    for (const c of b.contributors ?? []) if (c.role?.slug === "author") return c.contributor?.name;
    return b.contributors?.[0]?.contributor?.name;
  }

  private flattenPage(page: any): string {
    const parts: string[] = [];
    const walk = (node: any) => {
      if (Array.isArray(node)) node.forEach(walk);
      else if (node && typeof node === "object") {
        if (node.text?.text) parts.push(String(node.text.text));
        (node.children ?? []).forEach(walk);
        (node.contents ?? []).forEach(walk);
      }
    };
    walk(page);
    return parts.map((p) => p.trim()).filter(Boolean).join("\n");
  }
}
