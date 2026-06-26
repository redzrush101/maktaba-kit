import { NextResponse } from "next/server";
import { createMaktabaClient, type SourceSelect } from "@maktaba-kit/core";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ ok: false, data: [], errors: [] }, { status: 400 });
  const source = (url.searchParams.get("source") ?? "all") as SourceSelect;
  return NextResponse.json(await createMaktabaClient().books(q, { source, limit: Number(url.searchParams.get("limit") ?? 10) }));
}
