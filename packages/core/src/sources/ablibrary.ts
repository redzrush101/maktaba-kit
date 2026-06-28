import type { Book, Category, Page, SearchResult, TocItem } from "../models";
import type { HttpClient } from "../http";
import { arrayOfObjects, asArray, asNumber, asObj, asString, type AnyObj } from "../source-utils";

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
    const data = JSON.parse(res.text || "{}") as AnyObj;
    if (data.code) throw new Error(asString(data.message) ?? asString(data.code) ?? "ABLibrary error");
    return data;
  }

  async books(query: string, limit = 10, page = 1, fuzzy = true): Promise<Book[]> {
    const payload: AnyObj = { query, page, perPage: limit };
    if (fuzzy) payload.fuzzy = { enabled: true, fields: ["FIELD_TITLE", "FIELD_CONTRIBUTOR_NAME", "FIELD_CATEGORY_NAME"] };
    const data = await this.post("ablibrary.services.book_service.BookService", "List", payload);
    return arrayOfObjects(data.books).slice(0, limit).map((b) => this.book(b));
  }

  async categories(): Promise<Category[]> {
    const data = await this.post("ablibrary.services.category_service.CategoryService", "List", {});
    return arrayOfObjects(data.categories).map((category) => ({
      source: this.name,
      id: asString(category.id) ?? "",
      name: asString(category.name) ?? "",
      weight: asNumber(category.weight),
    })).filter((category) => category.id && category.name);
  }

  async categoryBooks(categoryId: string, limit = 50, page = 1): Promise<Book[]> {
    const data = await this.post("ablibrary.services.book_service.BookService", "List", { page, perPage: limit, categories: [categoryId] });
    return arrayOfObjects(data.books).slice(0, limit).map((b) => this.book(b));
  }

  async search(query: string, limit = 10, page = 1, bookId?: string): Promise<SearchResult[]> {
    if (bookId) {
      try {
        const data = await this.post("ablibrary.services.search_service.SearchService", "SearchInBook", { bookId, query, scope: ["SCOPE_TEXT"] });
        const pages = arrayOfObjects(asObj(data.abx)?.pages ?? asObj(data.ocr)?.pages);
        return pages.slice(0, limit).map((item) => {
          const p = asObj(item.page) ?? item;
          const pageNumber = asNumber(p.number);
          return { source: this.name, kind: "text", bookId, page: pageNumber, snippet: this.flattenPage(p).slice(0, 600), url: `https://v4.ablibrary.net/books/${bookId}${pageNumber ? `?page=${pageNumber}` : ""}` };
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
    return arrayOfObjects(data.results).slice(0, limit).map((item) => {
      const book = asObj(item.book) ?? {};
      const result = asObj(item.result) ?? {};
      const p = asObj(asObj(result.abx)?.page) ?? asObj(asObj(result.ocr)?.page) ?? {};
      const id = asString(book.id);
      const pageNumber = asNumber(p.number);
      return {
        source: this.name,
        kind: "text",
        bookId: id,
        bookTitle: asString(book.title),
        author: this.author(book),
        page: pageNumber,
        snippet: Object.keys(p).length ? this.flattenPage(p).slice(0, 600) : undefined,
        url: id ? `https://v4.ablibrary.net/books/${id}${pageNumber ? `?page=${pageNumber}` : ""}` : undefined,
        hitCount: asNumber(item.hitCount) ?? asNumber(item.hit_count),
      };
    });
  }

  async read(bookId: string, pages: number[]): Promise<Page[]> {
    const data = await this.post("ablibrary.services.book_service.BookService", "Contents", { bookId, pageNumbers: pages });
    return arrayOfObjects(asObj(data.abx)?.pages ?? asObj(data.ocr)?.pages).map((p) => {
      const parsed = this.parsePageText(p);
      const page = asNumber(p.number) ?? 1;
      return {
        source: this.name,
        bookId,
        page,
        label: asString(p.label),
        text: parsed.text,
        footnotes: parsed.footnotes,
        url: `https://v4.ablibrary.net/books/${bookId}?page=${page}`,
      };
    });
  }

  async info(bookId: string): Promise<Book> {
    const data = await this.post("ablibrary.services.book_service.BookService", "Details", { id: bookId });
    const book = this.book(asObj(data.book) ?? {});
    const volumes = await this.volumesFor(book);
    return { ...book, meta: { ...(book.meta ?? {}), volumes } };
  }

  async toc(bookId: string, limit = 100): Promise<TocItem[]> {
    const data = await this.post("ablibrary.services.book_service.BookService", "TableOfContents", { bookId });
    return arrayOfObjects(data.items).slice(0, limit).map((i) => {
      const page = asNumber(i.pageNumber);
      return { source: this.name, bookId, title: asString(i.title) ?? "", page, url: `https://v4.ablibrary.net/books/${bookId}${page ? `?page=${page}` : ""}` };
    });
  }

  async suggest(query: string, limit = 10) {
    const data = await this.post("ablibrary.services.search_service.SearchService", "Suggest", { query, paginate: { page: 1, perPage: limit } });
    return asArray(data.suggestions).slice(0, limit);
  }

  private async volumesFor(book: Book): Promise<Array<{ label: string; value: string }>> {
    if (!book.title) return [];
    try {
      const data = await this.post("ablibrary.services.book_service.BookService", "List", { query: book.title, page: 1, perPage: 100 });
      const title = normalizeTitle(book.title);
      const author = normalizeText(book.author ?? "");
      return arrayOfObjects(data.books)
        .map((item) => this.book(item))
        .filter((item) => normalizeTitle(item.title ?? "") === title)
        .filter((item) => !author || normalizeText(item.author ?? "") === author)
        .sort((a, b) => volumeNumber(a.volume) - volumeNumber(b.volume))
        .map((item) => ({ label: item.volume ?? item.title ?? item.id, value: item.id }));
    } catch {
      return [];
    }
  }

  private book(b: AnyObj): Book {
    const id = asString(b.id) ?? "";
    const volumeNumber = asNumber(b.volumeNumber);
    return {
      source: this.name,
      id,
      title: asString(b.title),
      author: this.author(b),
      volume: asString(b.volumeLabel) ?? (volumeNumber ? String(volumeNumber) : undefined),
      pages: asNumber(b.pagesCount),
      url: id ? `https://v4.ablibrary.net/books/${id}` : undefined,
      meta: { source: b.source, categories: b.categories, contributors: b.contributors, languages: b.languages },
    };
  }

  private author(b: AnyObj): string | undefined {
    for (const c of arrayOfObjects(b.contributors)) {
      const role = asObj(c.role);
      const contributor = asObj(c.contributor);
      if (role?.slug === "author") return asString(contributor?.name);
    }
    return asString(asObj(arrayOfObjects(b.contributors)[0]?.contributor)?.name);
  }

  private flattenPage(page: unknown): string {
    return this.parsePageText(page).text;
  }

  private parsePageText(page: unknown): { text: string; footnotes: Array<{ id: string; label: string; text: string }> } {
    const main: string[] = [];
    const footnoteTexts: string[] = [];
    const walk = (node: unknown, inFootnote = false) => {
      if (Array.isArray(node)) {
        node.forEach((child) => walk(child, inFootnote));
        return;
      }
      const item = asObj(node);
      if (!item) return;
      const isFootnote = inFootnote || Object.prototype.hasOwnProperty.call(item, "footnote");
      const text = asString(asObj(item.text)?.text)?.trim();
      if (text) (isFootnote ? footnoteTexts : main).push(text);
      asArray(item.children).forEach((child) => walk(child, isFootnote));
      asArray(item.contents).forEach((child) => walk(child, isFootnote));
    };
    walk(page);
    return {
      text: main.map((part) => part.trim()).filter(Boolean).join("\n"),
      footnotes: parseFootnotes(footnoteTexts.join("\n")),
    };
  }
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeTitle(value: string) {
  return normalizeText(value).replace(/[\s،,:؛-]*\(?\s*(?:ج|جلد|volume|vol\.?|v\.?)\s*[\d۰-۹٠-٩]+\s*\)?\s*$/i, "");
}

function volumeNumber(value: string | undefined) {
  const parsed = Number(value?.replace(/[^\d.]/g, "") ?? "");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : Number.MAX_SAFE_INTEGER;
}

function parseFootnotes(text: string) {
  const normalized = text.trim();
  if (!normalized) return [];
  const pattern = /\(\s*([\d٠-٩۰-۹]+)\s*\)\s*([\s\S]*?)(?=\(\s*[\d٠-٩۰-۹]+\s*\)|$)/g;
  const matches = [...normalized.matchAll(pattern)];
  if (!matches.length) return [{ id: "1", label: "(1)", text: normalized }];
  return matches.map((match, index) => ({
    id: match[1] || String(index + 1),
    label: `( ${match[1] || index + 1} )`,
    text: (match[2] ?? "").trim(),
  })).filter((note) => note.text);
}
