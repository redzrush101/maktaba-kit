export type CacheStore = {
  get<T>(key: string): T | Promise<T | undefined> | undefined;
  set(key: string, value: unknown, ttlMs?: number): void | Promise<void>;
};

type Entry = { value: unknown; expires: number };

export class MemoryCache implements CacheStore {
  private items = new Map<string, Entry>();
  constructor(private ttlMs = 86_400_000, private enabled = true, private maxEntries = 500) {}

  get<T>(key: string): T | undefined {
    if (!this.enabled) return undefined;
    const hit = this.items.get(key);
    if (!hit) return undefined;
    if (Date.now() > hit.expires) {
      this.items.delete(key);
      return undefined;
    }
    return hit.value as T;
  }

  set(key: string, value: unknown, ttlMs = this.ttlMs) {
    if (!this.enabled) return;
    if (this.items.size >= this.maxEntries && !this.items.has(key)) {
      const oldestKey = this.items.keys().next().value;
      if (oldestKey) this.items.delete(oldestKey);
    }
    this.items.set(key, { value, expires: Date.now() + ttlMs });
  }
}

function stableStringify(value: unknown): string {
  if (!value || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`).join(",")}}`;
}

export async function cacheKey(method: string, url: string, body?: unknown, headers?: unknown): Promise<string> {
  const input = stableStringify([method.toUpperCase(), url, body ?? null, headers ?? null]);
  const encoded = new TextEncoder().encode(input);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(digest));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `mk:http:${hashHex}`;
}
