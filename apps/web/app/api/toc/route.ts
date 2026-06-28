import { NextResponse } from "next/server";
import { badRequest, client, limitParam, requestUrl } from "../_shared";

export async function GET(req: Request) {
  const url = requestUrl(req);
  const ref = url.searchParams.get("ref") ?? "";
  if (!ref) return badRequest("ref is required");
  const limit = limitParam(url, 100, 500);

  return NextResponse.json(await client().toc(ref, limit));
}
