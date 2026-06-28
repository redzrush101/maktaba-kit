import { describe, expect, it } from "vitest";
import { cacheKey, MemoryCache } from "@maktaba-kit/core/server";

describe("MemoryCache", () => {
  it("does not read or write when disabled", () => {
    const cache = new MemoryCache(1_000, false);
    cache.set("a", 1);
    expect(cache.get("a")).toBeUndefined();
  });

  it("evicts the oldest entry when max entries is reached", () => {
    const cache = new MemoryCache(1_000, true, 2);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);

    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBe(2);
    expect(cache.get("c")).toBe(3);
  });

  it("builds stable keys", () => {
    expect(cacheKey("get", "https://example.test", undefined, { a: "b" })).toBe(cacheKey("GET", "https://example.test", undefined, { a: "b" }));
  });
});
