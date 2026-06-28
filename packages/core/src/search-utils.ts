import type { Book, SearchOptions, SearchResult } from "./models";

const diacritics = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const latinDiacritics = /[\u0300-\u036f]/g;
const punctuation = /[\s،؛,.!?؟:()[\]{}«»"'`ـ\-_/\\]+/g;

export function normalizeArabic(input: string | undefined) {
  return (input ?? "")
    .normalize("NFD")
    .replace(latinDiacritics, "")
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

type PreparedQuery = { normalized: string; tokens: string[] };

type NormalizedSearchResult = {
  text: string;
  snippet: string;
  title: string;
  author: string;
};

type NormalizedBook = {
  text: string;
  title: string;
  author: string;
};

function prepareQuery(query: string): PreparedQuery {
  return { normalized: normalizeArabic(query), tokens: searchTokens(query) };
}

function normalizedSearchResult(result: SearchResult): NormalizedSearchResult {
  const title = normalizeArabic(result.bookTitle);
  const author = normalizeArabic(result.author);
  return {
    text: normalizeArabic([result.snippet, result.bookTitle, result.author].filter(Boolean).join(" ")),
    snippet: normalizeArabic(result.snippet),
    title,
    author,
  };
}

function normalizedBook(book: Book): NormalizedBook {
  const title = normalizeArabic(book.title);
  const author = normalizeArabic(book.author);
  return { text: normalizeArabic(`${book.title ?? ""} ${book.author ?? ""}`), title, author };
}

export function scoreSearchResult(result: SearchResult, query: string) {
  return scorePreparedSearchResult(result, normalizedSearchResult(result), prepareQuery(query));
}

export function scoreBook(book: Book, query: string) {
  return scorePreparedBook(book, normalizedBook(book), prepareQuery(query));
}

function scorePreparedSearchResult(result: SearchResult, normalized: NormalizedSearchResult, query: PreparedQuery) {
  let score = 0;
  if (!query.normalized || normalized.snippet.includes(query.normalized)) score += 100;
  if (!query.normalized || normalized.title.includes(query.normalized)) score += 80;
  if (!query.normalized || normalized.author.includes(query.normalized)) score += 60;
  if (query.tokens.length && query.tokens.every((token) => normalized.text.includes(token))) score += 50;
  score += query.tokens.filter((token) => normalized.text.includes(token)).length * 8;
  if (result.hitCount) score += Math.min(25, Math.log10(result.hitCount + 1) * 8);
  if (result.page) score += 5;
  return score;
}

function scorePreparedBook(book: Book, normalized: NormalizedBook, query: PreparedQuery) {
  let score = 0;
  if (!query.normalized || normalized.title.includes(query.normalized)) score += 100;
  if (!query.normalized || normalized.author.includes(query.normalized)) score += 90;
  if (query.tokens.length && query.tokens.every((token) => normalized.text.includes(token))) score += 50;
  score += query.tokens.filter((token) => normalized.text.includes(token)).length * 10;
  if (book.pages) score += 3;
  return score;
}

export function sortSearchResults(results: SearchResult[], query: string) {
  const preparedQuery = prepareQuery(query);
  return results
    .map((result) => ({ result, score: scorePreparedSearchResult(result, normalizedSearchResult(result), preparedQuery) }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.result);
}

export function sortBooks(books: Book[], query: string) {
  const preparedQuery = prepareQuery(query);
  return books
    .map((book) => ({ book, score: scorePreparedBook(book, normalizedBook(book), preparedQuery) }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.book);
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
