import * as cheerio from "cheerio";
import type { Book, Page, SearchResult, TocItem } from "../models";
import type { HttpClient } from "../http";
import { asArray, asNumber, asObj, asString, cleanWhitespace, type AnyObj } from "../source-utils";

const typesenseKey = "AmswDdjQNKm0xVNBLhUpkgjLj4JnNNbh";
const arabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

export class ThaqalaynSource {
  name = "thaqalayn" as const;
  base = "https://thaqalayn.net";
  typesense = "https://api.thaqalayn.net:8108/multi_search";

  constructor(private http: HttpClient) {}

  private async multiSearch(searches: AnyObj[]) {
    const res = await this.http.postJson(this.typesense, { searches }, { "X-TYPESENSE-API-KEY": typesenseKey });
    if (res.status >= 400) throw new Error(`HTTP ${res.status}: ${res.text.slice(0, 200)}`);
    const data = JSON.parse(res.text || "{}") as AnyObj;
    const result = asObj(asArray(data.results)[0]) ?? {};
    if (result.error) throw new Error(asString(result.error) ?? "Thaqalayn search error");
    return result;
  }

  async books(query: string, limit = 10, page = 1): Promise<Book[]> {
    const result = await this.multiSearch([{ collection: "books", q: query || "*", query_by: "nameEn,nameAr,authorName,blurbEn", per_page: limit, page }]);
    return arrayHits(result).map((hit) => {
      const doc = asObj(hit.document) ?? {};
      const id = asString(doc.number) ?? asString(doc.id) ?? "";
      return {
        source: this.name,
        id,
        title: asString(doc.nameEn) ?? asString(doc.nameAr),
        author: asString(doc.authorName),
        url: id ? `${this.base}/book/${id}` : undefined,
        meta: { nameAr: doc.nameAr, blurbEn: doc.blurbEn, type: doc.type },
      };
    });
  }

  async search(query: string, limit = 10, page = 1, bookId?: string): Promise<SearchResult[]> {
    const script = arabic.test(query) ? "arabic" : "latin";
    const exact = query.trim().startsWith('"') && query.trim().endsWith('"');
    const q = exact ? query : query.trim();
    const search: AnyObj = { collection: "hadiths", q, preset: `hadiths-${exact ? "exact" : "full"}-${script}`, per_page: limit || 10, page };
    const filter = this.bookFilter(bookId);
    if (filter) search.filter_by = filter;
    const result = await this.multiSearch([search]);
    return arrayHits(result).map((hit) => this.searchResult(asObj(hit.document) ?? {}, query));
  }

  async read(bookId: string, pages: number[]): Promise<Page[]> {
    const page = pages[0] ?? 1;
    const parts = bookId.split("/").filter(Boolean);
    if (parts.length >= 3) {
      const doc = await this.hadithByParts(parts[0], parts[1], parts[2], page);
      if (doc) return [this.pageFromDoc(doc, bookId, page)];
      return [await this.pageFromHtml(parts[0], parts[1], parts[2], page)];
    }
    const toc = await this.toc(bookId, 1);
    const first = toc[0];
    if (!first?.bookId) throw new Error("No readable chapter found for this Thaqalayn book");
    return this.read(first.bookId, [first.page ?? 1]);
  }

  async info(bookId: string): Promise<Book> {
    const books = await this.books(bookId, 5);
    const exact = books.find((book) => book.id === bookId);
    if (exact) return exact;
    const html = await this.getText(`${this.base}/book/${bookId}`);
    const $ = cheerio.load(html);
    const title = cleanWhitespace($("h1").first().text()) || cleanWhitespace($("title").text().split("|")[0] ?? "");
    return { source: this.name, id: bookId, title, url: `${this.base}/book/${bookId}` };
  }

  async toc(bookId: string, limit = 100): Promise<TocItem[]> {
    const html = await this.getText(`${this.base}/book/${bookId}`);
    const $ = cheerio.load(html);
    const items: TocItem[] = [];
    $('a[href^="/chapter/"]').each((_, a) => {
      if (items.length >= limit) return;
      const href = $(a).attr("href") ?? "";
      const m = href.match(/\/chapter\/(\d+)\/(\d+)\/(\d+)/);
      const title = cleanWhitespace($(a).text()).replace(/^(Chapter\s+\d+\s*-\s*)/i, "");
      if (m && title) items.push({ source: this.name, bookId: `${m[1]}/${m[2]}/${m[3]}`, title, page: 1, url: `${this.base}${href}` });
    });
    return items;
  }

  async suggest(query: string, limit = 10) {
    return this.books(query, limit);
  }

  private async getText(url: string) {
    const res = await this.http.get(url);
    if (res.status >= 400) throw new Error(`HTTP ${res.status}: ${res.text.slice(0, 200)}`);
    return res.text;
  }

  private bookFilter(bookId?: string) {
    if (!bookId) return undefined;
    const parts = bookId.split("/").filter(Boolean);
    if (parts.length >= 3) return `bookId:${parts[0]} && volumeNumber:${parts[0]} && bookSectionNumber:${parts[1]} && chapterNumber:${parts[2]}`;
    return `bookId:${bookId}`;
  }

  private async hadithByParts(volume: string, section: string, chapter: string, number: number) {
    const filters = [
      `bookId:${volume} && volumeNumber:${volume} && bookSectionNumber:${section} && chapterNumber:${chapter} && number:${number}`,
      `bookId:${volume} && bookSectionNumber:${section} && chapterNumber:${chapter} && number:${number}`,
    ];
    for (const filter_by of filters) {
      const result = await this.multiSearch([{ collection: "hadiths", q: "*", filter_by, per_page: 1, page: 1 }]);
      const doc = asObj(arrayHits(result)[0]?.document);
      if (doc) return doc;
    }
    return undefined;
  }

  private searchResult(doc: AnyObj, query: string): SearchResult {
    const volume = asString(doc.volumeUrlPointer) ?? asString(doc.volumeNumber) ?? asString(doc.bookId);
    const section = asString(doc.bookSectionNumber) ?? "1";
    const chapter = asString(doc.chapterNumber) ?? "0";
    const number = asNumber(doc.number) ?? 1;
    return {
      source: this.name,
      kind: "text",
      bookId: `${volume}/${section}/${chapter}`,
      bookTitle: asString(doc.bookNameOriginal) ?? asString(doc.bookNameAr) ?? asString(doc.bookName),
      author: asString(doc.authorName),
      volume,
      page: number,
      snippet: asString(doc.textArDisplay) ?? asString(doc.textAr) ?? asString(doc.textEn),
      url: `${this.base}/hadith/${volume}/${section}/${chapter}/${number}`,
      hitCount: undefined,
      meta: { query, chapterName: doc.chapterNameOriginal ?? doc.chapterName, textEn: doc.textEn, grades: doc.grades, graderNames: doc.graderNames },
    };
  }

  private pageFromDoc(doc: AnyObj, bookId: string, page: number): Page {
    const result = this.searchResult(doc, "");
    const english = asString(doc.textEn)?.trim();
    const grades = asArray(doc.grades).map((grade) => cleanWhitespace(asString(grade) ?? "")).filter(Boolean);
    return {
      source: this.name,
      bookId,
      page,
      volume: result.volume,
      bookTitle: result.bookTitle,
      author: result.author,
      text: [asString(doc.textArDisplay) ?? asString(doc.textAr), english].filter(Boolean).join("\n\n"),
      url: result.url,
      footnotes: grades.map((grade, index) => ({ id: String(index + 1), label: `Grade ${index + 1}`, text: grade })),
      meta: { chapterName: result.meta?.chapterName, textEn: english },
    };
  }

  private async pageFromHtml(volume: string, section: string, chapter: string, page: number): Promise<Page> {
    const url = `${this.base}/hadith/${volume}/${section}/${chapter}/${page}`;
    const html = await this.getText(url);
    const $ = cheerio.load(html);
    const data = ldJson($).find((item) => asString(item["@type"]) === "Quotation");
    if (!data) throw new Error("Could not parse Thaqalayn hadith page");
    const bookTitle = asString(asObj(data.isBasedOn)?.name);
    const citations = asArray(data.citation).map((item) => asString(item)).filter(Boolean) as string[];
    return {
      source: this.name,
      bookId: `${volume}/${section}/${chapter}`,
      volume,
      page,
      bookTitle,
      text: asString(data.text) ?? cleanWhitespace($("main").text(), "\n"),
      url,
      footnotes: citations.map((text, index) => ({ id: String(index + 1), label: `Grade ${index + 1}`, text })),
      meta: { chapterName: asString(asObj(data.isPartOf)?.name) },
    };
  }
}

function arrayHits(result: AnyObj) {
  return arrayOfObjects(result.hits);
}

function arrayOfObjects(value: unknown): AnyObj[] {
  return asArray(value).flatMap((item) => asObj(item) ? [asObj(item)] as AnyObj[] : []);
}

function ldJson($: cheerio.CheerioAPI): AnyObj[] {
  const out: AnyObj[] = [];
  $('script[type="application/ld+json"]').each((_, script) => {
    try {
      const parsed = JSON.parse($(script).text()) as unknown;
      if (Array.isArray(parsed)) parsed.forEach((item) => { const obj = asObj(item); if (obj) out.push(obj); });
      else {
        const obj = asObj(parsed);
        if (obj) out.push(obj);
      }
    } catch {
      // Ignore malformed JSON-LD blocks; Thaqalayn pages include multiple script payloads.
    }
  });
  return out;
}
