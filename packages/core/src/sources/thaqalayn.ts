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
    const queries = bookQueries(query);
    const results = await Promise.all(queries.map((q) => this.multiSearch([{ collection: "books", q, query_by: "nameEn,nameAr,authorName,blurbEn", per_page: limit, page }])));
    const seen = new Set<string>();
    return results.flatMap((result) => arrayHits(result)).flatMap((hit) => {
      const doc = asObj(hit.document) ?? {};
      const id = asString(doc.number) ?? asString(doc.id) ?? "";
      if (!id || seen.has(id)) return [];
      seen.add(id);
      return [{
        source: this.name,
        id,
        title: asString(doc.nameEn) ?? asString(doc.nameAr),
        author: asString(doc.authorName),
        url: `${this.base}/book/${id}`,
        meta: { nameAr: doc.nameAr, blurbEn: doc.blurbEn, type: doc.type },
      }];
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
      if (doc) {
        const pg = this.pageFromDoc(doc, bookId, page);
        // Enrich gradings with reference book names from the HTML page
        if (asArray(doc.grades).filter(Boolean).length) {
          const htmlPage = await this.pageFromHtml(parts[0], parts[1], parts[2], page).catch(() => undefined);
          if (htmlPage?.meta?.gradings) {
            pg.meta = { ...pg.meta, gradings: htmlPage.meta.gradings };
          }
        }
        return [pg];
      }
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
    const rootBookId = bookId.split("/").filter(Boolean)[0] ?? bookId;
    const html = await this.getText(`${this.base}/book/${rootBookId}`);
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
    const textAr = asString(doc.textArDisplay) ?? asString(doc.textAr) ?? "";
    const textEn = asString(doc.textEn) ?? "";
    const isLatinQuery = !arabic.test(query);
    return {
      source: this.name,
      kind: "text",
      bookId: `${volume}/${section}/${chapter}`,
      bookTitle: asString(doc.bookNameOriginal) ?? asString(doc.bookNameAr) ?? asString(doc.bookName),
      author: asString(doc.authorName),
      volume,
      page: number,
      snippet: isLatinQuery && textEn ? textEn : textAr || textEn,
      url: `${this.base}/hadith/${volume}/${section}/${chapter}/${number}`,
      hitCount: undefined,
      meta: { query, chapterName: doc.chapterNameOriginal ?? doc.chapterName, textEn: doc.textEn, grades: doc.grades, graderNames: doc.graderNames },
    };
  }

  private pageFromDoc(doc: AnyObj, bookId: string, page: number): Page {
    const result = this.searchResult(doc, "");
    const english = asString(doc.textEn)?.trim();
    const grades = asArray(doc.grades).map((g) => cleanWhitespace(asString(g) ?? "")).filter(Boolean);
    const graderNames = asArray(doc.graderNames).map((g) => asString(g)).filter(Boolean) as string[];
    const gradings = grades.map((grade, i) => ({
      grade,
      grader: graderNames[i] ?? "",
    }));
    return {
      source: this.name,
      bookId,
      page,
      volume: result.volume,
      bookTitle: result.bookTitle,
      author: result.author,
      text: asString(doc.textArDisplay) ?? asString(doc.textAr) ?? "",
      url: result.url,
      footnotes: grades.map((grade, index) => ({ id: String(index + 1), label: `Grade ${index + 1}`, text: grade })),
      meta: { chapterName: result.meta?.chapterName, textEn: english, gradings },
    };
  }

  private async pageFromHtml(volume: string, section: string, chapter: string, page: number): Promise<Page> {
    const url = `${this.base}/hadith/${volume}/${section}/${chapter}/${page}`;
    const html = await this.getText(url);
    const $ = cheerio.load(html);
    const data = ldJson($).find((item) => asString(item["@type"]) === "Quotation");
    if (!data) throw new Error("Could not parse Thaqalayn hadith page");
    const bookTitle = asString(asObj(data.isBasedOn)?.name);
    const rawText = asString(data.text) ?? "";
    const citations = asArray(data.citation).map((item) => asString(item)).filter(Boolean) as string[];
    // Try richer gradings from embedded page data first
    const pageGradings = parsePageGradings(html);
    const gradings = pageGradings.length ? pageGradings : citations.map((c) => parseGradingCitation(c)).filter(Boolean);
    const { arabic, english } = splitArabicEnglish(rawText);
    return {
      source: this.name,
      bookId: `${volume}/${section}/${chapter}`,
      volume,
      page,
      bookTitle,
      text: arabic || rawText,
      url,
      footnotes: citations.map((text, index) => ({ id: String(index + 1), label: `Grade ${index + 1}`, text })),
      meta: { chapterName: asString(asObj(data.isPartOf)?.name), textEn: english, gradings },
    };
  }
}

function bookQueries(query: string) {
  const clean = query.trim();
  if (!clean || clean === "*") return ["*"];
  const variants = [clean];
  if (/^[a-z\s-]+$/i.test(clean) && !/^al[-\s]/i.test(clean)) variants.push(`Al-${clean}`, `Al ${clean}`);
  return [...new Set(variants)];
}

function parsePageGradings(html: string): Array<{ grade: string; grader: string; reference?: string }> {
  const out: Array<{ grade: string; grader: string; reference?: string }> = [];
  const startKey = '"gradings":';
  const idx = html.indexOf(startKey);
  if (idx < 0) return out;
  const start = html.indexOf("[", idx + startKey.length);
  if (start < 0) return out;
  let depth = 1;
  let end = start + 1;
  while (end < html.length && depth > 0) {
    const ch = html[end];
    if (ch === "[" || ch === "{") depth++;
    else if (ch === "]" || ch === "}") depth--;
    end++;
  }
  if (depth !== 0) return out;
  const raw = html.slice(start, end);
  try {
    const parsed = JSON.parse(raw) as AnyObj[];
    for (const g of parsed) {
      const grade = cleanWhitespace(asString(g.grade_ar) ?? "");
      if (!grade) continue;
      out.push({
        grade,
        grader: asString(asObj(g.author)?.name_en) ?? asString(asObj(g.author)?.name_ar) ?? "",
        reference: asString(g.reference_en) ?? undefined,
      });
    }
  } catch {
    // Ignore parse errors
  }
  return out;
}

function parseGradingCitation(citation: string): { grade: string; grader: string; reference?: string } | null {
  if (!citation) return null;
  const gradeMatch = citation.match(/grade:\s*([^;]+)/i);
  const refMatch = citation.match(/reference:\s*([^;]+)/i);
  const graderMatch = citation.match(/grader:\s*([^;]+)/i);
  if (!gradeMatch) return null;
  return {
    grade: gradeMatch[1].trim(),
    grader: graderMatch ? graderMatch[1].trim() : "",
    reference: refMatch ? refMatch[1].trim() : undefined,
  };
}

function splitArabicEnglish(text: string): { arabic: string; english?: string } {
  // The JSON-LD text often combines Arabic and English separated by \n\n
  const idx = text.search(/\n{2,}(?=[A-Za-z0-9])/);
  if (idx > 0) {
    const arabic = text.slice(0, idx).trim();
    const english = text.slice(idx).trim();
    if (english && /[A-Za-z]/.test(english)) return { arabic, english };
  }
  return { arabic: text.trim() };
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
