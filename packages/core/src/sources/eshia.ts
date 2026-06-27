import * as cheerio from "cheerio";
import type { Book, Page, SearchResult, TocItem } from "../models";
import type { HttpClient } from "../http";

export class EshiaSource {
  name = "eshia" as const;
  base = "https://lib.eshia.ir";

  constructor(private http: HttpClient) {}

  private async soup(url: string) {
    const res = await this.http.get(url);
    if (res.status >= 400) throw new Error(`HTTP ${res.status}: ${res.text.slice(0, 200)}`);
    return cheerio.load(res.text);
  }

  async books(query: string, limit = 10): Promise<Book[]> {
    const suggestions = await this.suggest(query, limit);
    return suggestions.map((x) => ({ source: this.name, id: String(x.id ?? ""), title: x.label, url: x.id ? `${this.base}/${x.id}/1/1` : undefined }));
  }

  async search(query: string, limit = 10, page = 1, bookId?: string): Promise<SearchResult[]> {
    const q = encodeURIComponent(query.trim().replaceAll(" ", "_"));
    const path = bookId ? `/search/${bookId}/${q}` : `/search/${q}`;
    const out: SearchResult[] = [];
    const wantsAll = limit <= 0;
    const target = wantsAll ? Number.POSITIVE_INFINITY : limit;
    const first = await this.soup(`${this.base}${path}${page > 1 ? `?page=${page}` : ""}`);
    const total = Number(clean(first(".result_count").first().text()).replace(/\D/g, "")) || 0;
    this.parseSearchRows(first, out, target);

    const totalPages = total ? Math.ceil(total / 10) : 1;
    const pagesNeeded = wantsAll ? totalPages : Math.ceil(limit / 10);
    const maxPage = Math.min(page + Math.max(1, pagesNeeded) - 1, page + 199, totalPages || page);
    for (let current = page + 1; current <= maxPage && out.length < target; current++) {
      const before = out.length;
      const $ = await this.soup(`${this.base}${path}?page=${current}`);
      this.parseSearchRows($, out, target);
      if (out.length === before) break;
    }
    return out;
  }

  private parseSearchRows($: cheerio.CheerioAPI, out: SearchResult[], limit: number) {
    $("#search-result tr").each((_, tr) => {
      if (out.length >= limit) return;
      const links = $(tr).find("div.result a[href]").toArray();
      const link = links.find((el) => Boolean(($(el).attr("href") ?? "").trim()));
      if (!link) return;
      const a = $(link);
      const href = a.attr("href") ?? "";
      const text = clean(a.text());
      const snippet = clean($(tr).find("div.preview").text());
      const m = href.match(/\/(\d+)\/(\d+)\/(\d+)/);
      out.push({
        source: this.name,
        kind: "text",
        bookId: m?.[1],
        bookTitle: between(text, "نام کتاب :", "، جلد :") ?? text,
        volume: m?.[2],
        page: m?.[3] ? Number(m[3]) : undefined,
        snippet: snippet || undefined,
        url: href.startsWith("http") ? href : `${this.base}${href}`,
        hitCount: Number(clean($(".result_count").first().text()).replace(/\D/g, "")) || undefined,
      });
    });
  }

  async read(bookId: string, pages: number[], volume = "1"): Promise<Page[]> {
    const out: Page[] = [];
    for (const page of pages) {
      const url = `${this.base}/${bookId}/${volume}/${page}`;
      const $ = await this.soup(url);
      out.push(this.parsePage($, bookId, volume, page, url));
    }
    return out;
  }

  async info(bookId: string, volume = "1"): Promise<Book> {
    const p = (await this.read(bookId, [1], volume))[0];
    const maxPage = typeof p.meta?.maxPage === "number" ? p.meta.maxPage : undefined;
    return { source: this.name, id: bookId, title: p.bookTitle, author: p.author, volume: p.volume, pages: maxPage, url: `${this.base}/${bookId}/${volume}/1`, meta: p.meta };
  }

  async toc(bookId: string, volume = "1", limit = 100): Promise<TocItem[]> {
    const first = await this.soup(`${this.base}/${bookId}/${volume}/1`);
    let href: string | undefined;
    first("a").each((_, a) => {
      if (!href && first(a).text().includes("فهرست")) href = first(a).attr("href");
    });
    if (!href) return [];
    const $ = await this.soup(new URL(href, this.base).toString());
    const items: TocItem[] = [];
    $("td.book-page-show a[href], .book-page-show a[href]").each((_, a) => {
      if (items.length >= limit) return;
      const title = clean($(a).text());
      const link = $(a).attr("href") ?? "";
      const m = link.match(/\/(\d+)\/(\d+)\/(\d+)/);
      if (m && title) items.push({ source: this.name, bookId, title, volume: m[2], page: Number(m[3]), url: new URL(link, this.base).toString() });
      else if (/^\d+$/.test(link.trim()) && title) items.push({ source: this.name, bookId, title, volume, page: Number(link.trim()), url: `${this.base}/${bookId}/${volume}/${link.trim()}` });
    });
    return items;
  }

  async suggest(query: string, limit = 10): Promise<Array<{ id?: string; label: string }>> {
    const url = `${this.base}/ajax/search/${Date.now()}`;
    const res = await this.http.postForm(url, { query }, { "X-Requested-With": "XMLHttpRequest" });
    if (res.status >= 400) throw new Error(`HTTP ${res.status}: ${res.text.slice(0, 200)}`);
    const $ = cheerio.load(res.text);
    const out: Array<{ id?: string; label: string }> = [];
    $("li").slice(0, limit).each((_, li) => {
      out.push({ id: $(li).attr("title"), label: clean($(li).text()) });
    });
    return out;
  }

  private parsePage($: cheerio.CheerioAPI, bookId: string, volume: string, page: number, url: string): Page {
    const heading = clean($(".book_title_heading").text());
    const author = clean($(".book_author_heading").text());
    const titleLine = clean($("td.Book_Title").text());
    const content = $("td.book-page-show, .book-page-show").first();
    content.find(".sticky-menue, script, style").remove();

    const main: string[] = [];
    const footnotes: Array<{ id: string; label: string; text: string }> = [];
    let inFootnotes = false;

    content.children().each((_, el) => {
      const tag = String(el.tagName ?? "").toLowerCase();
      if (tag === "hr") {
        inFootnotes = true;
        return;
      }
      const text = clean($(el).text());
      if (!text) return;
      if (!inFootnotes) {
        main.push(text);
        return;
      }
      for (const noteText of splitFootnotes(text)) {
        const label = noteText.match(/^\[[\d٠-٩۰-۹]+\]/)?.[0] ?? `[${footnotes.length + 1}]`;
        footnotes.push({ id: label.replace(/[[\]]/g, ""), label, text: noteText.replace(/^\[[\d٠-٩۰-۹]+\]\s*/, "") });
      }
    });

    const fallback = clean(content.text());
    const volumes = $("select[name='volume'] option").toArray().map((option) => ({
      label: clean($(option).text()),
      value: $(option).attr("value") ?? clean($(option).text()),
    })).filter((item, index, arr) => item.value && arr.findIndex((x) => x.value === item.value) === index);
    let maxPage: number | undefined;
    $("a[href]").each((_, a) => {
      if (!$(a).text().includes("آخر")) return;
      const m = ($(a).attr("href") ?? "").match(/\/(\d+)\/(\d+)\/(\d+)/);
      if (m && m[1] === bookId && m[2] === volume) maxPage = Number(m[3]);
    });
    return {
      source: this.name,
      bookId,
      volume,
      page,
      text: main.length ? main.join("\n\n") : fallback,
      bookTitle: heading.includes("جلد") ? heading.split("جلد")[0].trim() : heading || undefined,
      author: author || undefined,
      url,
      footnotes,
      meta: { titleLine, maxPage, volumes },
    };
  }
}

function clean(s: string, join = " ") {
  return (s || "").split(/\s+/).filter(Boolean).join(join);
}

function between(s: string, a: string, b: string) {
  const i = s.indexOf(a);
  if (i < 0) return undefined;
  const start = i + a.length;
  const j = s.indexOf(b, start);
  return (j >= 0 ? s.slice(start, j) : s.slice(start)).trim();
}

function splitFootnotes(text: string) {
  const normalized = text.trim();
  if (!normalized) return [];
  const parts = normalized.split(/(?=\[[\d٠-٩۰-۹]+\]\s*)/).map((p) => p.trim()).filter(Boolean);
  return parts.length ? parts : [normalized];
}
