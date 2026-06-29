import { NextResponse } from "next/server";
import { client, limitParam, positiveIntParam, requestUrl, sourceParam } from "../_shared";

export async function GET(req: Request) {
  const url = requestUrl(req);
  const categoryId = url.searchParams.get("categoryId")?.trim();
  if (categoryId) {
    return NextResponse.json(await client().categoryBooks(categoryId, {
      source: sourceParam(url),
      limit: limitParam(url, 50, 200),
      page: positiveIntParam(url, "page", 1),
    }));
  }
  const source = sourceParam(url);
  return NextResponse.json(await client().categories(source !== "all" ? source : undefined));
}
