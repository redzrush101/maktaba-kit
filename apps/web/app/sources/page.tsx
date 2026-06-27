import { Header } from "@/components/Header";

const sources = [
  {
    name: "ABLibrary",
    slug: "ablibrary",
    strengths: ["book search", "rich metadata", "categories in book records", "table of contents", "page reading", "full-text search"],
    limits: ["no complete public author/category index found", "autocomplete is opportunistic"],
  },
  {
    name: "eShia",
    slug: "eshia",
    strengths: ["full-text search", "book suggestions", "volume/page reading", "footnote parsing", "table of contents when exposed by source"],
    limits: ["metadata varies by book", "no complete public author/category index found"],
  },
];

export default function SourcesPage() {
  return (
    <main>
      <Header />
      <section className="mx-auto max-w-5xl px-4 pb-10" dir="ltr">
        <div className="mb-5 rounded-2xl border border-line bg-[rgb(var(--sheet))]/80 p-5 shadow-sm">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-accent">Sources</p>
          <h1 className="mt-2 font-sans text-3xl font-bold">Library source coverage</h1>
          <p className="mt-2 max-w-2xl font-sans text-sm leading-6 text-muted">Capabilities are based on the public pages and endpoints currently used by Maktaba Kit.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {sources.map((source) => (
            <article key={source.slug} className="rounded-2xl border border-line bg-paper/60 p-4 shadow-sm">
              <h2 className="font-sans text-2xl font-semibold">{source.name}</h2>
              <h3 className="mt-4 font-sans text-sm font-semibold text-ink">Supported</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 font-sans text-sm text-muted">
                {source.strengths.map((item) => <li key={item}>{item}</li>)}
              </ul>
              <h3 className="mt-4 font-sans text-sm font-semibold text-ink">Limits</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 font-sans text-sm text-muted">
                {source.limits.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
