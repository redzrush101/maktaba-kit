import { describe, expect, it } from "vitest";
import { bookPath, parseRef, readerPath } from "@maktaba-kit/core";

describe("references", () => {
  it("parses eShia shorthand refs", () => {
    expect(parseRef("eshia:11005/1/2")).toEqual({ source: "eshia", bookId: "11005", volume: "1", page: 2 });
  });

  it("parses ABLibrary shorthand refs", () => {
    expect(parseRef("ablibrary:123/9")).toEqual({ source: "ablibrary", bookId: "123", page: 9 });
  });

  it("builds reader paths", () => {
    expect(readerPath({ source: "eshia", bookId: "11005", volume: "1", page: 2 })).toBe("/read/eshia/11005/1/2");
    expect(readerPath({ source: "ablibrary", bookId: "123", page: 9 })).toBe("/read/ablibrary/123/9");
  });

  it("builds book paths", () => {
    expect(bookPath({ source: "eshia", bookId: "11005", volume: "2" })).toBe("/books/eshia/11005?volume=2");
    expect(bookPath({ source: "ablibrary", bookId: "123" })).toBe("/books/ablibrary/123");
  });
});
