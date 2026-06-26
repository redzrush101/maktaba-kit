import { NextResponse } from "next/server";
import { createMaktabaClient, type SourceSelect } from "@maktaba-kit/core";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ ok: false, data: [], errors: [{ source: "ablibrary", code: "MissingQuery", message: "q is required" }] }, { status: 400 });
  const source = (url.searchParams.get("source") ?? "all") as SourceSelect;
  const limit = Number(url.searchParams.get("limit") ?? 10);
  const client = createMaktabaClient({ timeoutMs: 18_000 });
  return NextResponse.json(await client.search(q, { source, limit }));
}
