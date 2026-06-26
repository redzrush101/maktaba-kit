import { MemoryCache, cacheKey } from "./cache";

export class HttpClient {
  constructor(
    private cache = new MemoryCache(),
    private timeoutMs = 20_000,
    private userAgent = "Mozilla/5.0 MaktabaKit/0.1",
  ) {}

  async request(method: string, url: string, init: RequestInit = {}) {
    const headers = { "User-Agent": this.userAgent, ...(init.headers as Record<string, string> | undefined) };
    const key = cacheKey(method, url, init.body, headers);
    const cached = this.cache.get<{ status: number; text: string; url: string; headers: Record<string, string> }>(key);
    if (cached) return cached;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(url, { ...init, method, headers, signal: controller.signal });
      const text = await res.text();
      const value = { status: res.status, text, url: res.url, headers: Object.fromEntries(res.headers.entries()) };
      this.cache.set(key, value);
      return value;
    } finally {
      clearTimeout(timer);
    }
  }

  get(url: string, init?: RequestInit) {
    return this.request("GET", url, init);
  }

  postJson(url: string, json: unknown, headers?: Record<string, string>) {
    return this.request("POST", url, {
      headers: { "Content-Type": "application/json", ...(headers ?? {}) },
      body: JSON.stringify(json),
    });
  }

  postForm(url: string, data: Record<string, string>, headers?: Record<string, string>) {
    return this.request("POST", url, {
      headers: { "Content-Type": "application/x-www-form-urlencoded;", ...(headers ?? {}) },
      body: new URLSearchParams(data).toString(),
    });
  }
}
