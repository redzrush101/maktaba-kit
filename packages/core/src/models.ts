export type SourceName = "ablibrary" | "eshia" | "thaqalayn" | "rafed";
export type SourceSelect = SourceName | "all";

/** Known ABLibrary book metadata fields. */
export type AblibraryBookMeta = Record<string, unknown>;

/** Known eShia book metadata fields. */
export type EshiaBookMeta = Record<string, unknown>;

/** Known Thaqalayn book metadata fields. */
export type ThaqalaynBookMeta = Record<string, unknown>;

export type BookMeta = Record<string, unknown>;

export type Book = {
  source: SourceName;
  id: string;
  title?: string;
  author?: string;
  volume?: string;
  pages?: number;
  url?: string;
  meta?: BookMeta;
};

export type SearchResultMeta = Record<string, unknown>;

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
  meta?: SearchResultMeta;
};

export type Footnote = {
  id: string;
  label: string;
  text: string;
};

/** Known ABLibrary page metadata fields. */
export type AblibraryPageMeta = Record<string, unknown>;

/** Known eShia page metadata fields. */
export type EshiaPageMeta = Record<string, unknown>;

/** Known Thaqalayn page metadata fields: chapterName, textEn, gradings. */
export type ThaqalaynPageMeta = Record<string, unknown>;

export type PageMeta = Record<string, unknown>;

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
  meta?: PageMeta;
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
  source: SourceName | "maktaba";
  code: string;
  message: string;
};

export type ApiSuccess<T> = {
  ok: true;
  data: T;
  errors: SourceError[];
  query?: string;
};

export type ApiFailure = {
  ok: false;
  data: [];
  errors: SourceError[];
  query?: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

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
