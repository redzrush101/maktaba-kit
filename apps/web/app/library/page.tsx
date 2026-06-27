import { Header } from "@/components/Header";
import { LibraryShelf } from "@/components/LibraryShelf";

export default function LibraryPage() {
  return (
    <main>
      <Header />
      <section className="mx-auto max-w-5xl px-4 pb-10" dir="ltr">
        <div className="mb-5 rounded-2xl border border-line bg-[rgb(var(--sheet))]/80 p-5 shadow-sm">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-accent">Personal library</p>
          <h1 className="mt-2 font-sans text-3xl font-bold">Bookmarks and reading history</h1>
          <p className="mt-2 max-w-2xl font-sans text-sm leading-6 text-muted">
            Stored locally in this browser. No account is required, and nothing is sent to the server.
          </p>
        </div>
        <LibraryShelf />
      </section>
    </main>
  );
}
