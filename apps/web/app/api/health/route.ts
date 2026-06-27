import { NextResponse } from "next/server";
import { client } from "../_shared";

export async function GET() {
  const maktaba = client();
  const [ablibrary, eshia] = await Promise.allSettled([
    maktaba.books("الكافي", { source: "ablibrary", limit: 1 }),
    maktaba.books("الكافي", { source: "eshia", limit: 1 }),
  ]);

  return NextResponse.json({
    ok: ablibrary.status === "fulfilled" || eshia.status === "fulfilled",
    sources: {
      ablibrary: status(ablibrary),
      eshia: status(eshia),
    },
    capabilities: {
      ablibrary: ["book-search", "metadata", "toc", "page-reading", "full-text-search"],
      eshia: ["book-suggestions", "toc-when-present", "volume-reading", "page-reading", "full-text-search", "footnotes"],
    },
  });
}

function status(result: PromiseSettledResult<unknown>) {
  if (result.status === "fulfilled") return { ok: true };
  return { ok: false, error: result.reason instanceof Error ? result.reason.message : String(result.reason) };
}
