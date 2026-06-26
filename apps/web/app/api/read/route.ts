import { NextResponse } from "next/server";
import { createMaktabaClient } from "@maktaba-kit/core";

export async function GET(req: Request) {
  const ref = new URL(req.url).searchParams.get("ref") ?? "";
  if (!ref) return NextResponse.json({ ok: false, data: [], errors: [] }, { status: 400 });
  return NextResponse.json(await createMaktabaClient().read(ref));
}
