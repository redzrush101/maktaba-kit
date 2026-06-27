#!/usr/bin/env python3
"""Probe upstream library websites and print supported capabilities.

This is intentionally read-only and uses only public pages/endpoints already used by
Maktaba Kit's source adapters.
"""
from __future__ import annotations

import json
import re
import urllib.parse
import urllib.request
from dataclasses import dataclass
from html.parser import HTMLParser
from typing import Any

UA = "Mozilla/5.0 MaktabaKit source capability analysis"


@dataclass
class ProbeResult:
    name: str
    ok: bool
    evidence: dict[str, Any]


class LinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: list[tuple[str, str]] = []
        self._href: str | None = None
        self._text: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag == "a":
            self._href = dict(attrs).get("href")
            self._text = []

    def handle_data(self, data: str) -> None:
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == "a" and self._href is not None:
            self.links.append((self._href, " ".join("".join(self._text).split())))
            self._href = None
            self._text = []


def request(url: str, data: bytes | None = None, headers: dict[str, str] | None = None) -> tuple[int, dict[str, str], str]:
    req = urllib.request.Request(url, data=data, headers={"User-Agent": UA, **(headers or {})})
    with urllib.request.urlopen(req, timeout=20) as res:
        return res.status, dict(res.headers), res.read().decode("utf-8", "ignore")


def ab_post(service: str, method: str, payload: dict[str, Any]) -> dict[str, Any]:
    body = json.dumps(payload, ensure_ascii=False).encode()
    _, _, text = request(
        f"https://grpc.ablibrary.net/{service}/{method}",
        body,
        {"Content-Type": "application/json", "x-language-id": "ar"},
    )
    return json.loads(text or "{}")


def analyze_ablibrary() -> ProbeResult:
    books = ab_post("ablibrary.services.book_service.BookService", "List", {"query": "الكافي", "page": 1, "perPage": 3})
    first = (books.get("books") or [{}])[0]
    book_id = str(first.get("id") or "")
    details = ab_post("ablibrary.services.book_service.BookService", "Details", {"id": book_id}) if book_id else {}
    toc = ab_post("ablibrary.services.book_service.BookService", "TableOfContents", {"bookId": book_id}) if book_id else {}
    search = ab_post("ablibrary.services.search_service.SearchService", "Search", {"query": "الحمد", "paginate": {"page": 1, "perPage": 3}})
    try:
        suggest = ab_post("ablibrary.services.search_service.SearchService", "Suggest", {"query": "الكافي", "paginate": {"page": 1, "perPage": 3}})
    except Exception as exc:
        suggest = {"error": str(exc)}

    same_title_volumes = [book for book in books.get("books", []) if book.get("title") == first.get("title") and book.get("volumeLabel")]
    return ProbeResult("ablibrary", True, {
        "supports_book_search": bool(books.get("books")),
        "supports_metadata": bool((details.get("book") or {}).get("contributors") or first.get("categories")),
        "supports_categories_in_book_metadata": bool(first.get("categories")),
        "supports_related_volumes_by_title_search": len(same_title_volumes) > 1,
        "sample_related_volumes": [{"id": book.get("id"), "volume": book.get("volumeLabel")} for book in same_title_volumes[:8]],
        "supports_toc": bool(toc.get("items")),
        "supports_full_text_search": bool(search.get("results")),
        "supports_suggestions": bool(suggest.get("suggestions")),
        "sample_book_id": book_id,
    })


def analyze_eshia() -> ProbeResult:
    q = urllib.parse.quote("الحمد")
    _, _, search_html = request(f"https://lib.eshia.ir/search/{q}")
    _, _, page_html = request("https://lib.eshia.ir/11005/1/1")
    parser = LinkParser()
    parser.feed(page_html)
    link_text = "\n".join(text for _, text in parser.links)
    ajax_status, _, ajax_html = request(
        f"https://lib.eshia.ir/ajax/search/0",
        urllib.parse.urlencode({"query": "الكافي"}).encode(),
        {"Content-Type": "application/x-www-form-urlencoded;", "X-Requested-With": "XMLHttpRequest"},
    )

    return ProbeResult("eshia", True, {
        "supports_full_text_search": "search-result" in search_html and "result_count" in search_html,
        "supports_book_page_reading": "book-page-show" in page_html,
        "supports_book_suggestions": ajax_status == 200 and "<li" in ajax_html,
        "supports_toc_when_link_present": "فهرست" in link_text,
        "supports_volume_selector": "name=\"volume\"" in page_html or "name='volume'" in page_html,
        "search_result_count_sample": re.search(r'class="result_count"[^>]*>(.*?)<', search_html, re.S).group(1).strip() if re.search(r'class="result_count"[^>]*>(.*?)<', search_html, re.S) else None,
    })


def analyze_thaqalayn() -> ProbeResult:
    robots_status, _, robots = request("https://thaqalayn.net/robots.txt")
    _, _, books_xml = request("https://thaqalayn.net/sitemap/books.xml")
    _, _, chapters_xml = request("https://thaqalayn.net/sitemap/chapters.xml")
    _, _, hadith_xml = request("https://thaqalayn.net/sitemap/hadith-0.xml")
    _, _, book_html = request("https://thaqalayn.net/book/1")
    body = json.dumps({"searches": [{"collection": "hadiths", "q": "الحمد", "preset": "hadiths-full-arabic", "per_page": 3, "page": 1}]}).encode()
    _, _, search_json = request("https://api.thaqalayn.net:8108/multi_search", body, {"Content-Type": "application/json", "X-TYPESENSE-API-KEY": "AmswDdjQNKm0xVNBLhUpkgjLj4JnNNbh"})
    search = json.loads(search_json or "{}")
    return ProbeResult("thaqalayn", True, {
        "robots_allows_public_pages": robots_status == 200 and "Allow: /" in robots and "Disallow: /api/" in robots,
        "books_in_sitemap": books_xml.count("<loc>"),
        "chapters_in_sitemap": chapters_xml.count("<loc>"),
        "hadith_in_sitemap_0": hadith_xml.count("<loc>"),
        "supports_book_toc_pages": "/chapter/" in book_html,
        "supports_hadith_typesense_search": bool((search.get("results") or [{}])[0].get("hits")),
    })


def main() -> None:
    results = [analyze_ablibrary(), analyze_eshia(), analyze_thaqalayn()]
    print(json.dumps([r.__dict__ for r in results], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
