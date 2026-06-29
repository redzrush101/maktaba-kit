export type SourceName = "ablibrary" | "eshia" | "thaqalayn" | "rafed";
export type SourceSelect = SourceName | "all";

export type VolumeOption = { label: string; value: string };

export type AblibraryBookMeta = {
  source?: unknown;
  categories?: unknown;
  contributors?: unknown;
  languages?: unknown;
  volumes?: VolumeOption[];
};

export type EshiaBookMeta = {
  titleLine?: string;
  maxPage?: number;
  volumes?: VolumeOption[];
  [key: string]: unknown;
};

export type ThaqalaynBookMeta = {
  nameAr?: unknown;
  blurbEn?: string;
  englishName?: string;
  authorLink?: string;
  authorDeathDate?: string;
  translator?: string;
  volumes?: VolumeOption[];
  [key: string]: unknown;
};

export type RafedBookMeta = {
  publisher?: string;
  subject?: string;
  edition?: string;
  publicationDate?: string;
  bEd?: string;
  bSt?: string;
  lim?: string;
  [key: string]: unknown;
};

export type BookMeta = AblibraryBookMeta | EshiaBookMeta | ThaqalaynBookMeta | RafedBookMeta | Record<string, unknown>;

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

export type HadithGrade = { grade: string; grader: string; reference?: string };

export type AblibraryPageMeta = Record<string, unknown>;

export type EshiaPageMeta = {
  titleLine?: string;
  maxPage?: number;
  volumes?: VolumeOption[];
  [key: string]: unknown;
};

export type ThaqalaynPageMeta = {
  chapterName?: string;
  textEn?: string;
  gradings?: HadithGrade[];
  [key: string]: unknown;
};

export type RafedPageMeta = {
  pageLabel?: string;
  [key: string]: unknown;
};

export type PageMeta = AblibraryPageMeta | EshiaPageMeta | ThaqalaynPageMeta | RafedPageMeta | Record<string, unknown>;

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

export type CategoryBookOptions = { limit?: number; page?: number };

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
  categories?(): Promise<Category[]>;
  categoryBooks?(categoryId: string, options?: CategoryBookOptions): Promise<Book[]>;
}
