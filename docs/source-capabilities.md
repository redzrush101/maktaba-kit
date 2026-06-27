# Source capability analysis

Generated from `scripts/analyze_sources.py` against public pages/endpoints used by the adapters.

## ABLibrary

Supported and evidenced:

- Book search via `BookService/List`.
- Rich book metadata from list/details responses: contributors, categories, language, page count, volume labels.
- Table of contents via `BookService/TableOfContents`.
- Full-text search via `SearchService/Search` and in-book search via existing adapter fallback/endpoint.
- Page reading via `BookService/Contents`.

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

## Implementable features from these capabilities

Good fits now:

- Improved search filters and result display.
- Richer book pages using available metadata.
- Local bookmarks, notes, and recently-read history.
- Reader keyboard shortcuts and navigation polish.
- Source health/capability API.
- Loading/error pages.

Require more source research or a local index:

- Complete authors catalog.
- Complete categories catalog.
- Popular books across the whole library.
- Related books beyond metadata opportunism.
