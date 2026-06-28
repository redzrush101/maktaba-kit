import { NextResponse } from "next/server";
import { client, limitParam, positiveIntParam, requestUrl } from "../_shared";

export async function GET(req: Request) {
  const url = requestUrl(req);
  const categoryId = url.searchParams.get("categoryId")?.trim();
  if (categoryId) {
    return NextResponse.json(await client().categoryBooks(categoryId, {
      limit: limitParam(url, 50),
      page: positiveIntParam(url, "page", 1),
    }));
  }
  return NextResponse.json(await client().categories());
}
