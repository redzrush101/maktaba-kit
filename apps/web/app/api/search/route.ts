import { NextResponse } from "next/server";
import { badRequest, client, limitParam, positiveIntParam, requestUrl, sourceParam } from "../_shared";

const MAX_QUERY_LENGTH = 500;

export async function GET(req: Request) {
  const url = requestUrl(req);
  const q = url.searchParams.get("q")?.trim() ?? "";
  if (!q) return badRequest("q is required");
  if (q.length > MAX_QUERY_LENGTH) return badRequest(`q must be at most ${MAX_QUERY_LENGTH} characters`);

  return NextResponse.json(await client().search(q, {
    source: sourceParam(url),
    limit: limitParam(url, 10, 200),
    page: positiveIntParam(url, "page", 1),
    bookId: url.searchParams.get("bookId") ?? undefined,
    volume: url.searchParams.get("volume") ?? undefined,
    strictVolume: url.searchParams.get("strictVolume") === "1",
    exact: url.searchParams.get("exact") === "1",
    matchAll: url.searchParams.get("matchAll") === "1",
  }));
}
