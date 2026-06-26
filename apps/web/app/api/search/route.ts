import { NextResponse } from "next/server";
import { createMaktabaClient, type SourceSelect } from "@maktaba-kit/core";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ ok: false, data: [], errors: [{ source: "ablibrary", code: "MissingQuery", message: "q is required" }] }, { status: 400 });
  const source = (url.searchParams.get("source") ?? "all") as SourceSelect;
  const rawLimit = url.searchParams.get("limit") ?? "10";
  const limit = rawLimit === "all" ? 0 : Number(rawLimit);
  const bookId = url.searchParams.get("bookId") ?? undefined;
  const volume = url.searchParams.get("volume") ?? undefined;
  const strictVolume = url.searchParams.get("strictVolume") === "1";
  const exact = url.searchParams.get("exact") === "1";
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const client = createMaktabaClient({ timeoutMs: 18_000 });
  return NextResponse.json(await client.search(q, { source, limit, page, bookId, volume, strictVolume, exact }));
}
