import { NextResponse } from "next/server";
import { client } from "../_shared";

export async function GET() {
  const maktaba = client();
  const [ablibrary, eshia, rafed, thaqalayn] = await Promise.allSettled([
    maktaba.books("الكافي", { source: "ablibrary", limit: 1 }),
    maktaba.books("الكافي", { source: "eshia", limit: 1 }),
    maktaba.books("الكافي", { source: "rafed", limit: 1 }),
    maktaba.books("الكافي", { source: "thaqalayn", limit: 1 }),
  ]);

  return NextResponse.json({
    ok: ablibrary.status === "fulfilled" || eshia.status === "fulfilled" || rafed.status === "fulfilled" || thaqalayn.status === "fulfilled",
    sources: {
      ablibrary: status(ablibrary),
      eshia: status(eshia),
      rafed: status(rafed),
      thaqalayn: status(thaqalayn),
    },
    capabilities: {
      ablibrary: ["book-search", "category-browsing", "metadata", "toc", "page-reading", "full-text-search"],
      eshia: ["book-suggestions", "toc-when-present", "volume-reading", "page-reading", "full-text-search", "footnotes"],
      rafed: ["book-search", "category-browsing", "metadata", "toc", "page-reading", "full-text-search", "doc-download"],
      thaqalayn: ["book-search", "metadata", "toc", "hadith-reading", "full-text-search", "english-translation", "gradings"],
    },
  });
}

function status(result: PromiseSettledResult<unknown>) {
  if (result.status === "fulfilled") return { ok: true };
  return { ok: false, error: result.reason instanceof Error ? result.reason.message : String(result.reason) };
}
