import { createMaktabaClient, MemoryCache, type CacheStore } from "@maktaba-kit/core";

const ttlMs = Number(process.env.MAKTABA_CACHE_TTL_MS ?? 86_400_000);
const localCache = new MemoryCache(ttlMs, true, Number(process.env.MAKTABA_MEMORY_CACHE_ENTRIES ?? 1_000));

export const maktabaClient = createMaktabaClient({
  timeoutMs: 18_000,
  ttlMs,
  cacheStore: createCacheStore(),
});

function createCacheStore(): CacheStore {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return localCache;
  return new UpstashRestCache(url, token, localCache, ttlMs);
}

class UpstashRestCache implements CacheStore {
  constructor(
    private url: string,
    private token: string,
    private memory: MemoryCache,
    private ttlMs: number,
  ) {}

  async get<T>(key: string): Promise<T | undefined> {
    const memoryHit = this.memory.get<T>(key);
    if (memoryHit) return memoryHit;
    try {
      const result = await this.command<string | null>(["GET", key]);
      if (!result) return undefined;
      const parsed = JSON.parse(result) as T;
      this.memory.set(key, parsed, this.ttlMs);
      return parsed;
    } catch {
      return undefined;
    }
  }

  async set(key: string, value: unknown, ttlMs = this.ttlMs): Promise<void> {
    this.memory.set(key, value, ttlMs);
    try {
      await this.command(["SET", key, JSON.stringify(value), "EX", String(Math.max(1, Math.ceil(ttlMs / 1_000)))]);
    } catch {
      // Redis/KV outages should not break library reads; memory cache remains active.
    }
  }

  private async command<T>(command: string[]): Promise<T> {
    const res = await fetch(this.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
    });
    if (!res.ok) throw new Error(`Redis HTTP ${res.status}`);
    const data = await res.json() as { result?: T; error?: string };
    if (data.error) throw new Error(data.error);
    return data.result as T;
  }
}
