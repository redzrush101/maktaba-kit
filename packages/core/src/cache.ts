type Entry = { value: unknown; expires: number };

export class MemoryCache {
  private items = new Map<string, Entry>();
  constructor(private ttlMs = 86_400_000, private enabled = true) {}

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

  set(key: string, value: unknown) {
    if (!this.enabled) return;
    this.items.set(key, { value, expires: Date.now() + this.ttlMs });
  }
}

export function cacheKey(method: string, url: string, body?: unknown, headers?: unknown) {
  return JSON.stringify([method.toUpperCase(), url, body ?? null, headers ?? null]);
}
