import * as cheerio from "cheerio";
import type { Book, Category, Footnote, LibrarySource, Page, SearchResult, TocItem } from "../models";
import type { HttpClient } from "../http";
import { cleanWhitespace, type AnyObj } from "../source-utils";

const arabicDigits = /[\u0660-\u0669]/g;

/** Convert Arabic-Indic digits (\u0660-\u0669) to Western digits. */
function arabicToWestern(s: string): string {
  return s.replace(arabicDigits, (d) => String("\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669".indexOf(d)));
}

/** Decode HTML numeric entities like &#1633; \u2192 1 */
function decodeNumericEntities(s: string): string {
  return s.replace(/&#(\d+);/g, (_m, num) => String.fromCharCode(Number(num)));
}

function clean(s: string): string {
  return cleanWhitespace(s, " ");
}

// =========================================================================
// Category definitions (stable as observed on the site)
// =========================================================================
const RAFED_CATEGORIES: Array<{ id: string; name: string; weight?: number }> = [
  { id: "1", name: "القرآن وعلومه", weight: 100 },
  { id: "2", name: "الحديث وعلومه", weight: 99 },
  { id: "3", name: "العقائد والكلام", weight: 98 },
  { id: "4", name: "الفقه", weight: 97 },
  { id: "5", name: "أصول الفقه", weight: 96 },
  { id: "6", name: "رجال الحديث", weight: 95 },
  { id: "7", name: "سيرة النبي (ص) وأهل البيت (ع)", weight: 94 },
  { id: "8", name: "التراجم", weight: 93 },
  { id: "9", name: "الأخلاق", weight: 92 },
  { id: "10", name: "الفرق والمذاهب", weight: 91 },
  { id: "11", name: "التاريخ والجغرافيا", weight: 90 },
  { id: "12", name: "الفلسفة والمنطق", weight: 89 },
  { id: "13", name: "القانون", weight: 88 },
  { id: "14", name: "الإقتصاد", weight: 87 },
  { id: "15", name: "العلوم السياسية", weight: 86 },
  { id: "16", name: "المکتبة الإسلامية", weight: 85 },
  { id: "17", name: "علم النفس والتربية والاجتماع", weight: 84 },
  { id: "18", name: "العلوم الطبيعيّة", weight: 83 },
  { id: "19", name: "الشعر والأدب", weight: 82 },
  { id: "20", name: "العرفان والأدعية والزيارات", weight: 81 },
  { id: "21", name: "دليل المؤلفات", weight: 80 },
  { id: "22", name: "العامة", weight: 79 },
  { id: "23", name: "الطب", weight: 78 },
  { id: "24", name: "اللغة والبلاغة", weight: 77 },
  { id: "25", name: "المکتبة الإسلامية", weight: 76 },
  { id: "26", name: "مجلّة تراثنا", weight: 75 },
];

// =========================================================================
// Helpers
// =========================================================================

function extractInt(text: string | undefined | null): number | undefined {
  if (!text) return undefined;
  const western = arabicToWestern(decodeNumericEntities(text));
  const m = western.match(/\d+/);
  return m ? Number(m[0]) : undefined;
}

/** Parse sidebar HTML to extract a field value by label. */
function parseSidebarField(sidebarHtml: string, fieldLabel: string): string | undefined {
  // The sidebar has lines like:  المؤلف: VALUE<br>  or  الموضوع : <a>VALUE</a><br>
  // Use a regex that matches the field label followed by optional colon.
  // The value is everything up to the next <br> or </div> (including tags).
  const pattern = new RegExp(
    `${fieldLabel}\\s*:?\\s*([^<]*(?:<(?!br\\s*/?>|\\/div)[^>]*>[^<]*)*)\\s*(?:<br|<\\/div|$)`,
    "i",
  );
  const m = sidebarHtml.match(pattern);
  if (m) {
    // Strip any HTML tags from the captured value
    const val = m[1].replace(/<[^>]+>/g, "").trim();
    return val || undefined;
  }
  return undefined;
}

// =========================================================================
// Parse helpers
// =========================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseSearchRow(row: any): SearchResult | undefined {
  // Search result row structure:
  //   <div class="resultRow">
  //     <span style="font-size:10px;color:#888;">description</span><br />  (optional)
  //     <a href="...?b_id=N"><h2>TITLE</h2> <span style="color:#DA0;">[volumes info]</span></a><br>
  //     <span style="color: green;">AUTHOR</span> في <a href="...">CATEGORY</a><br>
  //     <span class="msg">...</span>  (optional)
  //     <div class="resultFound">...</div>  (optional)
  //   </div>
  const link = row.find("a[href*='b_id=']").first();
  const href = link.attr("href") ?? "";
  const bidMatch = href.match(/b_id=(\d+)/);
  const bookId = bidMatch ? bidMatch[1] : undefined;
  if (!bookId) return undefined;

  // Title is in <h2> inside the link
  const title = clean(row.find("h2").first().text()) || undefined;

  // Author is in a <span> with color:green (the inline style)
  const author = clean(row.find('span[style*="green"]').first().text()) || undefined;

  // Snippet from resultFound div
  const snippet = clean(row.find("div.resultFound").text()) || undefined;

  return {
    source: "rafed",
    kind: "text",
    bookId,
    bookTitle: title,
    author,
    url: `https://lib.rafed.net/view.php?type=c_fbook&b_id=${bookId}`,
    snippet: snippet?.slice(0, 600),
    meta: {},
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseInBookRow(row: any): SearchResult | undefined {
  const link = row.find("a[href]").first();
  const href = link.attr("href") ?? "";
  const linkText = clean(link.text());
  const snippet = clean(row.find("div.restext").text());
  const pageText = clean(row.find("div.respage").text());

  const rel = link.attr("rel");
  const page = rel ? Number(rel) : undefined;
  const heading = clean(row.prevAll("li.resrow").first().find("h3").text());

  return {
    source: "rafed",
    kind: "text",
    bookId: undefined,
    bookTitle: heading || undefined,
    page,
    snippet: snippet || linkText || undefined,
    url: href.startsWith("http") ? href : `https://lib.rafed.net/${href}`,
    meta: { pageLabel: pageText },
  };
}

// =========================================================================
// Main adapter
// =========================================================================

export class RafedSource implements LibrarySource {
  name = "rafed" as const;
  base = "https://lib.rafed.net";

  constructor(private http: HttpClient) {}

  // -----------------------------------------------------------------------
  // SEARCH (global)
  // -----------------------------------------------------------------------
  async search(query: string, limit = 10, _page = 1, bookId?: string): Promise<SearchResult[]> {
    if (bookId) {
      return this.searchInBook(query, limit, bookId);
    }
    return this.searchGlobal(query, limit, _page);
  }

  private async searchGlobal(query: string, limit: number, page: number): Promise<SearchResult[]> {
    const params = new URLSearchParams({ text: query, output: "true", page: String(Math.max(0, page - 1)) });
    const url = `${this.base}/ac.php?${params}`;
    const res = await this.http.get(url);
    if (res.status >= 400) throw new Error(`Rafed search HTTP ${res.status}`);
    const data = JSON.parse(res.text || "{}") as AnyObj;
    const output = typeof data.output === "string" ? data.output : "";

    const $ = cheerio.load(output);
    const results: SearchResult[] = [];
    $("div.resultRow").each((_, row) => {
      if (results.length >= limit) return false;
      const r = parseSearchRow($(row));
      if (r) results.push(r);
    });

    return results;
  }

  private async searchInBook(query: string, limit: number, bookId: string): Promise<SearchResult[]> {
    const params = new URLSearchParams({ text: query, book: bookId, output: "true" });
    const url = `${this.base}/ac.php?${params}`;
    const res = await this.http.get(url);
    if (res.status >= 400) throw new Error(`Rafed in-book search HTTP ${res.status}`);
    const data = JSON.parse(res.text || "{}") as AnyObj;
    const output = typeof data.output === "string" ? data.output : "";

    const $ = cheerio.load(output);
    const results: SearchResult[] = [];
    const maxRows = limit <= 0 ? Number.POSITIVE_INFINITY : Math.max(limit, 500);
    $("li.resrowt").each((_, row) => {
      if (results.length >= maxRows) return false;
      const r = parseInBookRow($(row));
      if (r) {
        r.bookId = bookId;
        results.push(r);
      }
    });

    return results;
  }

  // -----------------------------------------------------------------------
  // BOOKS (title/author search)
  // -----------------------------------------------------------------------
  async books(query: string, limit = 10, page = 1): Promise<Book[]> {
    // Use title search (ops=1) to find books
    const params = new URLSearchParams({ text: query, output: "true", ops: "1", page: String(Math.max(0, page - 1)) });
    const url = `${this.base}/ac.php?${params}`;
    const res = await this.http.get(url);
    if (res.status >= 400) throw new Error(`Rafed books HTTP ${res.status}`);
    const data = JSON.parse(res.text || "{}") as AnyObj;
    const output = typeof data.output === "string" ? data.output : "";

    const $ = cheerio.load(output);
    const results: Book[] = [];
    $("div.resultRow").each((_, row) => {
      if (results.length >= limit) return false;
      const row$ = $(row);

      // Find the primary link (the one with the book ID)
      const link = row$.find("a[href*='b_id=']").first();
      const href = link.attr("href") ?? "";
      const bidMatch = href.match(/b_id=(\d+)/);
      const bookId = bidMatch ? bidMatch[1] : undefined;
      if (!bookId) return;

      // Title is inside <h2> within the link
      const title = clean(row$.find("h2").first().text()) || undefined;
      if (!title) return;

      // Author is in <span style="color: green;">
      const author = clean(row$.find('span[style*="green"]').first().text()) || undefined;

      // Volume info from the gold span
      const volSpan = clean(row$.find('span[style*="#DA0"]').first().text());
      let volume: string | undefined;
      const volMatch = volSpan.match(/([\d\u0660-\u0669]+)/);
      if (volMatch) {
        volume = arabicToWestern(volMatch[1]);
      }

      results.push({
        source: this.name,
        id: bookId,
        title,
        author,
        volume,
        url: `https://lib.rafed.net/view.php?type=c_fbook&b_id=${bookId}`,
      });
    });

    return results;
  }

  // -----------------------------------------------------------------------
  // READ (page content)
  // -----------------------------------------------------------------------
  async read(bookId: string, pages: number[]): Promise<Page[]> {
    const results: Page[] = [];

    const minPage = Math.min(...pages);
    const maxPage = Math.max(...pages);
    // Rafed's endpoint returns a fixed 20-page block, and content is only
    // aligned correctly when pst is the block start (1, 21, 41, ...).
    const pst = Math.floor((Math.max(1, minPage) - 1) / 20) * 20 + 1;
    const ped = Math.ceil(maxPage / 20) * 20;

    const params = new URLSearchParams({ book: bookId, pst: String(pst), ped: String(ped) });
    const url = `${this.base}/ajax-fbook.php?${params}`;
    const res = await this.http.get(url);
    if (res.status >= 400) throw new Error(`Rafed read HTTP ${res.status}`);

    const data = JSON.parse(res.text || "{}") as Record<string, string>;
    const requested = new Set(pages);

    for (const [pageStr, html] of Object.entries(data)) {
      const pageNum = Number(pageStr);
      if (!requested.has(pageNum)) continue;

      const $ = cheerio.load(html);
      const pgContent = $("div.pgcontent").first();
      const pgnum = clean($("div.pgnum").first().text());

      // Extract structured footnotes before flattening page text.
      pgContent.find("script, style, link").remove();
      const footnotes: Footnote[] = [];
      pgContent.find("p[class^='rfdFootnote']").each((i, noteEl) => {
        const noteText = clean($(noteEl).text());
        const parsed = parseRafedFootnote(noteText, i);
        if (parsed) footnotes.push(parsed);
      });
      pgContent.find("p[class^='rfdFootnote'], p.rfdLine").remove();

      let text = clean(pgContent.text());
      if (!text) {
        // Maybe it's an image page
        const img = pgContent.find("img").first();
        const imgSrc = img.attr("src") ?? "";
        if (imgSrc) {
          text = `[صورة: ${imgSrc}]`;
        }
      }

      const label = arabicToWestern(decodeNumericEntities(pgnum));

      results.push({
        source: this.name,
        bookId,
        page: pageNum,
        text: text || "",
        label: label || undefined,
        url: `https://lib.rafed.net/view.php?type=c_fbook&b_id=${bookId}&page=${pageNum}`,
        footnotes: footnotes.length ? footnotes : undefined,
      });
    }

    return results;
  }

  // -----------------------------------------------------------------------
  // INFO (book metadata)
  // -----------------------------------------------------------------------
  async info(bookId: string, _volume?: string): Promise<Book> {
    const url = `${this.base}/view.php?type=c_fbook&b_id=${bookId}`;
    const res = await this.http.get(url);
    if (res.status >= 400) throw new Error(`Rafed info HTTP ${res.status}`);

    const html = res.text;
    const $ = cheerio.load(html);

    // Extract JS variables
    const bookName = extractJsVar(html, "bookName");
    const bEd = extractJsVar(html, "bEd"); // total items
    const bSt = extractJsVar(html, "bSt"); // start item
    const limRaw = extractJsVar(html, "lim"); // items per page
    const lim = limRaw ? Number(limRaw) : 20;

    // Parse sidebar from raw HTML (not .text()) to preserve <br> separators
    const sidebarHtml =
      parseSidebarDiv(html, "bookinfo") || parseSidebarDiv(html, "pbookinfo") || "";

    const author = parseSidebarField(sidebarHtml, "المؤلف");
    const publisher = parseSidebarField(sidebarHtml, "الناشر");
    const subject = parseSidebarField(sidebarHtml, "الموضوع");
    const pagesRaw = parseSidebarField(sidebarHtml, "الصفحات");
    const edition = parseSidebarField(sidebarHtml, "الطبعة");
    const pubDate = parseSidebarField(sidebarHtml, "تاريخ النشر");

    // bEd is Rafed's final page number; lim is only the AJAX batch size.
    let pages: number | undefined;
    if (pagesRaw) {
      pages = extractInt(pagesRaw);
    }
    if (pages === undefined && bEd) {
      pages = Number(bEd);
    }

    // Determine volume from H1 (e.g. "الكافي - ج ١" or "الكافي - ج 1")
    const h1 = clean(decodeNumericEntities($("h1").first().text()));
    let volume: string | undefined;
    // Match patterns like: - ج ١ or - جلد ١ or ج ١ or (ج ١) or [ج ١]
    const volMatch = h1.match(
      /(?:[-\u2013\u2014,\s]+|\u200c)?(?:ج|جلد|volume|vol\.?)\s*([\d\u0660-\u0669]+)/i,
    );
    if (volMatch) {
      volume = arabicToWestern(volMatch[1]);
    }

    return {
      source: this.name,
      id: bookId,
      title: bookName || h1 || undefined,
      author: author || undefined,
      volume,
      pages,
      url: `https://lib.rafed.net/view.php?type=c_fbook&b_id=${bookId}`,
      meta: {
        publisher: publisher ? clean(decodeNumericEntities(publisher)) : undefined,
        subject: subject ? clean(subject) : undefined,
        edition: edition ? decodeNumericEntities(edition) : undefined,
        publicationDate: pubDate ? decodeNumericEntities(pubDate) : undefined,
        bEd,
        bSt,
        lim: String(lim),
      },
    };
  }

  // -----------------------------------------------------------------------
  // TABLE OF CONTENTS
  // -----------------------------------------------------------------------
  async toc(bookId: string, limit = 500): Promise<TocItem[]> {
    const url = `${this.base}/view.php?type=c_fbook&b_id=${bookId}`;
    const res = await this.http.get(url);
    if (res.status >= 400) throw new Error(`Rafed toc HTTP ${res.status}`);

    const html = res.text;
    const treeItems = parseTreeviewToc(html, this.name, bookId, limit);
    if (treeItems.length) return treeItems;

    const entries = parseIndexArray(html);

    // Fallback only: indexArray entries are Array(index, pageNumber).
    const items: TocItem[] = [];
    for (let i = 0; i < Math.min(entries.length, limit); i++) {
      const [, page] = entries[i];
      items.push({
        source: this.name,
        bookId,
        title: `#${i + 1}`,
        page,
        volume: undefined,
        level: 0,
        url: `https://lib.rafed.net/view.php?type=c_fbook&b_id=${bookId}&page=${page}`,
      });
    }

    return items;
  }

  // -----------------------------------------------------------------------
  // SUGGEST (autocomplete)
  // -----------------------------------------------------------------------
  async suggest(query: string, limit = 10): Promise<unknown[]> {
    const params = new URLSearchParams({ text: query, output: "true", ops: "1" });
    const url = `${this.base}/ac.php?${params}`;
    try {
      const res = await this.http.get(url);
      const data = JSON.parse(res.text || "{}") as AnyObj;
      const output = typeof data.output === "string" ? data.output : "";
      const $ = cheerio.load(output);
      const suggestions: Array<{ id: string; label: string }> = [];
      $("div.resultRow").each((_, row) => {
        if (suggestions.length >= limit) return false;
        const row$ = $(row);
        const link = row$.find("a[href*='b_id=']").first();
        const href = link.attr("href") ?? "";
        const bidMatch = href.match(/b_id=(\d+)/);
        const text = clean(row$.find("h2").first().text()) || clean(row$.text());
        if (bidMatch && text) {
          suggestions.push({ id: bidMatch[1], label: text });
        }
      });
      return suggestions;
    } catch {
      return [];
    }
  }

  // -----------------------------------------------------------------------
  // CATEGORIES
  // -----------------------------------------------------------------------
  async categories(): Promise<Category[]> {
    return RAFED_CATEGORIES.map((c) => ({
      source: this.name,
      id: c.id,
      name: c.name,
      weight: c.weight,
    }));
  }

  async categoryBooks(categoryId: string, limit = 50, page = 1): Promise<Book[]> {
    const params = new URLSearchParams({
      type: "c_blist",
      cid: categoryId,
      page: String(page),
      order: "title",
      limit: String(Math.min(limit, 200)),
    });
    const url = `${this.base}/view.php?${params}`;
    const res = await this.http.get(url);
    if (res.status >= 400) throw new Error(`Rafed category books HTTP ${res.status}`);

    const $ = cheerio.load(res.text);
    const books: Book[] = [];

    $("a[href*='c_fbook']").each((_, a) => {
      if (books.length >= limit) return false;
      const href = $(a).attr("href") ?? "";
      const bidMatch = href.match(/b_id=(\d+)/);
      if (!bidMatch) return;
      const bookId = bidMatch[1];
      const title = clean($(a).text());
      if (!title) return;

      books.push({
        source: this.name,
        id: bookId,
        title,
        url: `https://lib.rafed.net/view.php?type=c_fbook&b_id=${bookId}`,
      });
    });

    return books;
  }
}

// =========================================================================
// Extraction helpers
// =========================================================================

function parseTreeviewToc(html: string, source: "rafed", bookId: string, limit: number): TocItem[] {
  const $ = cheerio.load(html);
  const items: TocItem[] = [];
  $("ul.treeview a[href*=page], ul.treeview a[rel]").each((_, link) => {
    if (items.length >= limit) return false;
    const link$ = $(link);
    const title = clean(link$.text());
    const relPage = extractInt(link$.attr("rel"));
    const href = link$.attr("href") ?? "";
    const hrefPage = extractInt(href.match(/[?&]page=([\d\u0660-\u0669]+)/)?.[1]);
    const page = relPage ?? hrefPage;
    if (!title || !page) return;

    const level = Math.max(0, link$.parents("ul").length - 1);
    items.push({
      source,
      bookId,
      title,
      page,
      volume: undefined,
      level,
      url: `https://lib.rafed.net/view.php?type=c_fbook&b_id=${bookId}&page=${page}`,
    });
  });
  return items;
}

function parseRafedFootnote(noteText: string, index: number): Footnote | undefined {
  if (!noteText) return undefined;
  const m = noteText.match(/^(\([\d\u0660-\u0669]+\)|[\d\u0660-\u0669]+)\s*(.*)$/);
  const label = m?.[1] ?? String(index + 1);
  const text = (m?.[2] ?? noteText).trim();
  return {
    id: `rafed-note-${index + 1}`,
    label,
    text,
  };
}

function extractJsVar(html: string, name: string): string | undefined {
  const patterns = [
    new RegExp(`(?:var\\s+)?${name}\\s*=\\s*'([^']+)'`),
    new RegExp(`(?:var\\s+)?${name}\\s*=\\s*"([^"]+)"`),
    new RegExp(`(?:var\\s+)?${name}\\s*=\\s*(\\d+)`),
  ];
  for (const pattern of patterns) {
    const m = html.match(pattern);
    if (m) return m[1];
  }
  return undefined;
}

/** Extract the raw HTML inside a sidebar div by class name. */
function parseSidebarDiv(html: string, className: string): string | undefined {
  const m = html.match(new RegExp(`<div[^>]*class="[^"]*${className}[^"]*"[^>]*>(.*?)</div>`, "s"));
  return m ? m[1] : undefined;
}

function parseIndexArray(html: string): Array<[number, number]> {
  const entries: Array<[number, number]> = [];
  const re = /indexArray\[ic\+\+\]\s*=\s*Array\(([^)]+)\);/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const parts = m[1].split(",");
    const a = Number(parts[0]?.trim());
    const b = Number(parts[1]?.trim());
    if (Number.isFinite(a) && Number.isFinite(b)) {
      entries.push([a, b]);
    }
  }
  return entries;
}
