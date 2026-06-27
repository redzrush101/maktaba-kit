import { NextResponse } from "next/server";
import { badRequest, client, requestUrl } from "../_shared";

export async function GET(req: Request) {
  const ref = requestUrl(req).searchParams.get("ref") ?? "";
  if (!ref) return badRequest("ref is required");

  return NextResponse.json(await client().info(ref));
}
