import { type ApiResponse, type SourceSelect } from "@maktaba-kit/core";
import { maktabaClient } from "@/lib/maktaba-client";
import { NextResponse } from "next/server";

const sources = new Set<SourceSelect>(["all", "ablibrary", "eshia", "thaqalayn"]);

export function requestUrl(req: Request) {
  return new URL(req.url);
}

export function sourceParam(url: URL): SourceSelect {
  const value = url.searchParams.get("source") ?? "all";
  return sources.has(value as SourceSelect) ? (value as SourceSelect) : "all";
}

export function positiveIntParam(url: URL, name: string, fallback: number) {
  const parsed = Number(url.searchParams.get(name) ?? fallback);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : fallback;
}

export function limitParam(url: URL, fallback: number) {
  const raw = url.searchParams.get("limit") ?? String(fallback);
  if (raw === "all") return 0;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function client() {
  return maktabaClient;
}

export function badRequest(message: string) {
  const body: ApiResponse<[]> = {
    ok: false,
    data: [],
    errors: [{ source: "ablibrary", code: "BadRequest", message }],
  };
  return NextResponse.json(body, { status: 400 });
}
