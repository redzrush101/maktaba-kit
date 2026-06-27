import { NextResponse } from "next/server";
import { badRequest, client, requestUrl } from "../_shared";

export async function GET(req: Request) {
  const ref = requestUrl(req).searchParams.get("ref") ?? "";
  if (!ref) return badRequest("ref is required");
  const limit = Number(requestUrl(req).searchParams.get("limit")) || undefined;

  return NextResponse.json(await client().toc(ref, limit));
}
