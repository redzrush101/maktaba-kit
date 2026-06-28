# Source capability analysis

Generated from `scripts/analyze_sources.py` against public pages/endpoints used by the adapters.

## ABLibrary

Supported and evidenced:

- Book search via `BookService/List`.
- Rich book metadata from list/details responses: contributors, categories, language, page count, volume labels.
- Table of contents via `BookService/TableOfContents`.
- Full-text search via `SearchService/Search` and in-book search via existing adapter fallback/endpoint.
- Page reading via `BookService/Contents`.
- Related volumes can be inferred by querying the same title and matching author/title records; each volume is a distinct ABLibrary book id.

Limitations found:

- Global browse-all catalog, standalone authors index, and standalone category index are not exposed by the currently used public endpoint set. Categories/authors can still be surfaced from book metadata and search results.
- Suggest endpoint was not consistently available from the Python probe, so autocomplete should stay opportunistic.

## eShia

Supported and evidenced:

- Full-text search pages under `/search/<query>`.
- Book/page reading under `/<book>/<volume>/<page>`.
- AJAX book suggestions under `/ajax/search/<timestamp>`.
- Table of contents when a book page exposes a `فهرست` link.
- Volume selector metadata on pages when available.
- Footnotes can be parsed from book page HTML.

Limitations found:

- No stable public standalone author/category catalog was identified from the probed pages.
- Metadata depth varies per page/book and should be treated as partial.

## Thaqalayn

Supported and evidenced:

- Public site access is allowed by `robots.txt`; `/api/` and `/super/` are disallowed and are not used.
- Public sitemaps expose books, chapters, hadith pages, Quran pages, and duas.
- Hadith full-text search is available through the public Typesense endpoint used by the site frontend.
- Book search is available through the public Typesense `books` collection.
- Book table of contents can be parsed from public `/book/<id>` pages.
- Individual hadith reading is available from structured Typesense documents and public `/hadith/<volume>/<section>/<chapter>/<number>` pages.
- Hadith metadata includes book title, chapter title, author, English translation, and grading data when present.

Limitations found:

- Thaqalayn is hadith/chapter based rather than page based, so reader URLs represent chapter + hadith number instead of physical pages.
- Arabic book-title search in the `books` collection is weaker than hadith text search.
- Quran, duas, and narrator collections exist, but are intentionally not integrated yet because current Maktaba Kit source support is centered on books/text reading.

## Rafed (lib.rafed.net)

Supported and evidenced (via Python probe against public endpoints):

- Book search by title via `ac.php?ops=1`.
- Global full-text search via `ac.php?text=<query>&output=true`.
- In-book full-text search via `ac.php?text=<query>&book=<id>&output=true`.
- Rich book metadata from sidebar on the book view page: author, publisher, edition, publication date, page count, subject.
- Page reading via `ajax-fbook.php?book=<id>&pst=<start>&ped=<end>` — returns JSON of page number → HTML content.
- Table of contents via `indexArray` JS variable embedded in the book page (page-number-based sections).
- Category browsing via `view.php?type=c_blist&cid=<id>`; 26 stable categories identified.
- Multi-volume books (separate book IDs per volume, detectable by title matching).
- DOC download via `print.php?type=d_book&book=<id>&format=doc` (ZIP containing Word DOC + font).
- Search pagination (20 results per page via `page` parameter).
- Category-filtered search (`ac.php?cid=<id>`).

Limitations found:

- `robots.txt` disallows all crawlers (`Disallow: /`).
- Paginated search capped at 20 results per page; no way to request more.
- Some pages are scanned images only (no extractable text).
- No standalone authors or full catalog index — must search by title/author.
- Page loading beyond the first 20 items requires AJAX calls (`ajax-fbook.php`); the server returns groups of ~20 pages.
- Book info (metadata) is only available from the HTML sidebar on the reading page, not from a dedicated API endpoint.
- Multi-volume book linking must be inferred from title similarity (e.g., searching the base title and matching).

## Implementable features from these capabilities

Good fits now:

- Improved search filters and result display.
- Richer book pages using available metadata.
- Local bookmarks, notes, and recently-read history.
- Reader keyboard shortcuts and navigation polish.
- Source health/capability API.
- Loading/error pages.
- Rafed source: book search, full-text search, metadata, page reading with HTML support, category browsing, DOC download.

Require more source research or a local index:

- Complete authors catalog.
- Complete categories catalog.
- Popular books across the whole library.
- Related books beyond metadata opportunism.
