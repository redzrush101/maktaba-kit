import type { Book, SearchOptions, SearchResult } from "./models";

const diacritics = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const punctuation = /[\s،؛,.!?؟:()[\]{}«»"'`ـ\-_/\\]+/g;

export function normalizeArabic(input: string | undefined) {
  return (input ?? "")
    .replace(diacritics, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ی")
    .replace(/ـ/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function searchTokens(query: string) {
  return normalizeArabic(query).split(punctuation).map((token) => token.trim()).filter(Boolean);
}

export function includesNormalized(text: string | undefined, query: string) {
  const normalizedQuery = normalizeArabic(query);
  if (!normalizedQuery) return true;
  return normalizeArabic(text).includes(normalizedQuery);
}

export function matchesAllTokens(text: string | undefined, query: string) {
  const haystack = normalizeArabic(text);
  const tokens = searchTokens(query);
  return tokens.length > 0 && tokens.every((token) => haystack.includes(token));
}

export function dedupeSearchResults(results: SearchResult[]) {
  const seen = new Set<string>();
  return results.filter((result) => {
    const key = [result.source, result.bookId, result.volume, result.page, normalizeArabic(result.snippet)].join(":");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function dedupeBooks(books: Book[]) {
  const seen = new Set<string>();
  return books.filter((book) => {
    const key = [book.source, book.id].join(":");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function scoreSearchResult(result: SearchResult, query: string) {
  const text = [result.snippet, result.bookTitle, result.author].filter(Boolean).join(" ");
  const title = result.bookTitle ?? "";
  const author = result.author ?? "";
  const tokens = searchTokens(query);
  let score = 0;
  if (includesNormalized(result.snippet, query)) score += 100;
  if (includesNormalized(title, query)) score += 80;
  if (includesNormalized(author, query)) score += 60;
  if (tokens.length && matchesAllTokens(text, query)) score += 50;
  score += tokens.filter((token) => normalizeArabic(text).includes(token)).length * 8;
  if (result.hitCount) score += Math.min(25, Math.log10(result.hitCount + 1) * 8);
  if (result.page) score += 5;
  return score;
}

export function scoreBook(book: Book, query: string) {
  const title = book.title ?? "";
  const author = book.author ?? "";
  const text = `${title} ${author}`;
  const tokens = searchTokens(query);
  let score = 0;
  if (includesNormalized(title, query)) score += 100;
  if (includesNormalized(author, query)) score += 90;
  if (tokens.length && matchesAllTokens(text, query)) score += 50;
  score += tokens.filter((token) => normalizeArabic(text).includes(token)).length * 10;
  if (book.pages) score += 3;
  return score;
}

export function sortSearchResults(results: SearchResult[], query: string) {
  return [...results].sort((a, b) => scoreSearchResult(b, query) - scoreSearchResult(a, query));
}

export function sortBooks(books: Book[], query: string) {
  return [...books].sort((a, b) => scoreBook(b, query) - scoreBook(a, query));
}

export function postProcessSearchResults(results: SearchResult[], query: string, options: SearchOptions = {}) {
  const volumeFiltered = options.volume ? results.filter((result) => String(result.volume ?? "") === String(options.volume)) : results;
  let out = options.volume && (volumeFiltered.length || options.strictVolume) ? volumeFiltered : results;
  out = dedupeSearchResults(out);
  if (options.exact) out = out.filter((result) => includesNormalized([result.snippet, result.bookTitle].filter(Boolean).join(" "), query));
  if (options.matchAll) out = out.filter((result) => matchesAllTokens([result.snippet, result.bookTitle, result.author].filter(Boolean).join(" "), query));
  return sortSearchResults(out, query);
}

export function postProcessBooks(books: Book[], query: string, options: SearchOptions = {}) {
  let out = sortBooks(dedupeBooks(books), query);
  if (options.matchAll) out = out.filter((book) => matchesAllTokens([book.title, book.author].filter(Boolean).join(" "), query));
  return out;
}
