import { describe, expect, it } from "vitest";
import { includesNormalized, matchesAllTokens, normalizeArabic, scoreBook, searchTokens } from "@maktaba-kit/core";

describe("search utilities", () => {
  it("normalizes Arabic variants and diacritics", () => {
    expect(normalizeArabic("إِنَّ الأَعْمَالَ")).toBe("ان الاعمال");
    expect(normalizeArabic("كتاب كافي")).toBe("کتاب کافی");
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

  it("tokenizes punctuation", () => {
    expect(searchTokens("الكافي، الكليني")).toEqual(["الکافی", "الکلینی"]);
  });
});
