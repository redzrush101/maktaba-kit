import { NextResponse } from "next/server";
import { badRequest, client, limitParam, positiveIntParam, requestUrl, sourceParam } from "../_shared";

export async function GET(req: Request) {
  const url = requestUrl(req);
  const q = url.searchParams.get("q")?.trim() ?? "";
  if (!q) return badRequest("q is required");

  return NextResponse.json(await client().books(q, {
    source: sourceParam(url),
    limit: limitParam(url, 10, 200),
    page: positiveIntParam(url, "page", 1),
  }));
}
