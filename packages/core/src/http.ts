import { MemoryCache, cacheKey, type CacheStore } from "./cache";

export type HttpResponse = { status: number; text: string; url: string; headers: Record<string, string> };

const hostQueues = new Map<string, Promise<void>>();
const retryStatuses = new Set([429, 500, 502, 503, 504]);

export class HttpClient {
  constructor(
    private cache: CacheStore = new MemoryCache(),
    private timeoutMs = 20_000,
    private userAgent = "Mozilla/5.0 MaktabaKit/0.1 (+https://github.com/maktaba-kit)",
    private minHostDelayMs = 350,
    private retries = 2,
  ) {}

  async request(method: string, url: string, init: RequestInit = {}): Promise<HttpResponse> {
    const headers = { "User-Agent": this.userAgent, ...(init.headers as Record<string, string> | undefined) };
    const key = cacheKey(method, url, init.body, headers);
    const cached = await this.cache.get<HttpResponse>(key);
    if (cached) return cached;

    let lastError: unknown;
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      await this.waitForHost(url);
      try {
        const value = await this.fetchOnce(method, url, init, headers);
        if (value.status < 400) await this.cache.set(key, value);
        if (!retryStatuses.has(value.status) || attempt === this.retries) return value;
      } catch (error) {
        lastError = error;
        if (attempt === this.retries) throw error;
      }
      await delay(250 * 2 ** attempt);
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }

  private async fetchOnce(method: string, url: string, init: RequestInit, headers: Record<string, string>): Promise<HttpResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(url, { ...init, method, headers, signal: controller.signal });
      const text = await res.text();
      return { status: res.status, text, url: res.url, headers: Object.fromEntries(res.headers.entries()) };
    } finally {
      clearTimeout(timer);
    }
  }

  private async waitForHost(url: string) {
    const host = new URL(url).host;
    const previous = hostQueues.get(host) ?? Promise.resolve();
    let release!: () => void;
    const current = previous.then(() => new Promise<void>((resolve) => { release = resolve; }));
    hostQueues.set(host, current);
    await previous;
    setTimeout(release, this.minHostDelayMs);
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

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
