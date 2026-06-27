import { describe, expect, it } from "vitest";
import { arrayOfObjects, asNumber, asObj, asString, cleanWhitespace } from "@maktaba-kit/core";

describe("source utilities", () => {
  it("safely reads basic values", () => {
    expect(asObj({ a: 1 })).toEqual({ a: 1 });
    expect(asObj(["x"])).toBeUndefined();
    expect(asString(12)).toBe("12");
    expect(asNumber("42")).toBe(42);
  });

  it("filters arrays to objects", () => {
    expect(arrayOfObjects([{ a: 1 }, null, "x", { b: 2 }])).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it("cleans repeated whitespace", () => {
    expect(cleanWhitespace(" a\n\t b  c ")).toBe("a b c");
    expect(cleanWhitespace(" a\n b ", "\n")).toBe("a\nb");
  });
});
