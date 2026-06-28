export type SourceName = "ablibrary" | "eshia" | "thaqalayn";
export type SourceSelect = SourceName | "all";

export type Book = {
  source: SourceName;
  id: string;
  title?: string;
  author?: string;
  volume?: string;
  pages?: number;
  url?: string;
  meta?: Record<string, unknown>;
};

export type SearchResult = {
  source: SourceName;
  kind: "text";
  bookId?: string;
  bookTitle?: string;
  author?: string;
  volume?: string;
  page?: number;
  snippet?: string;
  url?: string;
  hitCount?: number;
  meta?: Record<string, unknown>;
};

export type Footnote = {
  id: string;
  label: string;
  text: string;
};

export type Page = {
  source: SourceName;
  bookId: string;
  page: number;
  text: string;
  volume?: string;
  label?: string;
  bookTitle?: string;
  author?: string;
  url?: string;
  footnotes?: Footnote[];
  meta?: Record<string, unknown>;
};

export type TocItem = {
  source: SourceName;
  bookId: string;
  title: string;
  page?: number;
  volume?: string;
  level?: number;
  url?: string;
};

export type Category = {
  source: SourceName;
  id: string;
  name: string;
  weight?: number;
};

export type SourceError = {
  source: SourceName;
  code: string;
  message: string;
};

export type ApiResponse<T> = {
  ok: boolean;
  data: T;
  errors: SourceError[];
  query?: string;
};

export type SearchOptions = {
  source?: SourceSelect;
  limit?: number;
  page?: number;
  bookId?: string;
  volume?: string;
  exact?: boolean;
  context?: number;
  strictVolume?: boolean;
  matchAll?: boolean;
};

export interface LibrarySource {
  name: SourceName;
  books(query: string, limit?: number, page?: number): Promise<Book[]>;
  search(query: string, limit?: number, page?: number, bookId?: string): Promise<SearchResult[]>;
  read(bookId: string, pages: number[], volume?: string): Promise<Page[]>;
  info(bookId: string, volume?: string): Promise<Book>;
  toc(bookId: string, volumeOrLimit?: string | number, limit?: number): Promise<TocItem[]>;
  suggest(query: string, limit?: number): Promise<unknown[]>;
}
