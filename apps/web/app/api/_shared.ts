import { type ApiResponse } from "@maktaba-kit/core/client";
import { maktabaClient } from "@/lib/maktaba-client";
import { limitParam, positiveIntParam, sourceParam } from "@/lib/search-params";
import { NextResponse } from "next/server";

export function requestUrl(req: Request) {
  return new URL(req.url);
}

export { limitParam, positiveIntParam, sourceParam };

export function client() {
  return maktabaClient();
}

export function badRequest(message: string) {
  const body: ApiResponse<[]> = {
    ok: false,
    data: [],
    errors: [{ source: "maktaba", code: "BadRequest", message }],
  };
  return NextResponse.json(body, { status: 400 });
}
