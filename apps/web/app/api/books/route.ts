import { NextResponse } from "next/server";
import { badRequest, client, limitParam, positiveIntParam, requestUrl, sourceParam } from "../_shared";

const MAX_QUERY_LENGTH = 500;

export async function GET(req: Request) {
  const url = requestUrl(req);
  const q = url.searchParams.get("q")?.trim() ?? "";
  if (!q) return badRequest("q is required");
  if (q.length > MAX_QUERY_LENGTH) return badRequest(`q must be at most ${MAX_QUERY_LENGTH} characters`);

  return NextResponse.json(await client().books(q, {
    source: sourceParam(url),
    limit: limitParam(url, 10, 200),
    page: positiveIntParam(url, "page", 1),
  }));
}
