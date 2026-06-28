import { describe, expect, it } from "vitest";
import { includesNormalized, matchesAllTokens, normalizeArabic, scoreBook, scoreSearchResult, searchTokens } from "@maktaba-kit/core/client";

describe("search utilities", () => {
  it("normalizes Arabic and Latin variants and diacritics", () => {
    expect(normalizeArabic("إِنَّ الأَعْمَالَ")).toBe("ان الاعمال");
    expect(normalizeArabic("كتاب كافي")).toBe("کتاب کافی");
    expect(normalizeArabic("Al-Kāfi")).toBe("al-kafi");
  });

  it("matches normalized phrases", () => {
    expect(includesNormalized("إِنَّما الأَعْمالُ بالنِّيّات", "انما الاعمال")).toBe(true);
  });

  it("matches all query tokens", () => {
    expect(matchesAllTokens("كتاب الكافي للكليني", "الكافي كليني")).toBe(true);
    expect(matchesAllTokens("كتاب الكافي", "الكافي الصدوق")).toBe(false);
  });

  it("scores title and author matches", () => {
    const exact = scoreBook({ source: "ablibrary", id: "1", title: "الكافي", author: "الكليني" }, "الكافي");
    const weak = scoreBook({ source: "ablibrary", id: "2", title: "تهذيب الأحكام" }, "الكافي");
    expect(exact).toBeGreaterThan(weak);
  });

  it("prioritizes earlier query terms over later broad matches", () => {
    const focused = scoreSearchResult({
      source: "rafed",
      kind: "text",
      bookId: "1858",
      page: 269,
      snippet: "بشرط حذف فاعل وتهيئه تكون فى الفعل بهذا منبئه فالأوّل اضمم مطلقا",
    }, "وتهيئة الفعل لذلك بضم أوله");
    const broad = scoreSearchResult({
      source: "rafed",
      kind: "text",
      bookId: "1858",
      page: 260,
      snippet: "قد تقدم التنبيه على أن الفعل والفاعل كجزأى كلمة ولذلك لم يستغن عن الفاعل",
    }, "وتهيئة الفعل لذلك بضم أوله");
    expect(focused).toBeGreaterThan(broad);
  });

  it("tokenizes punctuation", () => {
    expect(searchTokens("الكافي، الكليني")).toEqual(["الکافی", "الکلینی"]);
  });
});
