import { Redis } from "@upstash/redis";
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
  return new UpstashBackedCache(new Redis({ url, token }), localCache, ttlMs);
}

class UpstashBackedCache implements CacheStore {
  constructor(
    private redis: Redis,
    private memory: MemoryCache,
    private ttlMs: number,
  ) {}

  async get<T>(key: string): Promise<T | undefined> {
    const memoryHit = this.memory.get<T>(key);
    if (memoryHit) return memoryHit;
    try {
      const redisHit = await this.redis.get<T>(key);
      if (redisHit) this.memory.set(key, redisHit, this.ttlMs);
      return redisHit ?? undefined;
    } catch {
      return undefined;
    }
  }

  async set(key: string, value: unknown, ttlMs = this.ttlMs): Promise<void> {
    this.memory.set(key, value, ttlMs);
    try {
      await this.redis.set(key, value, { ex: Math.max(1, Math.ceil(ttlMs / 1_000)) });
    } catch {
      // Redis/KV outages should not break library reads; memory cache remains active.
    }
  }
}
