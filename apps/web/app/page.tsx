import { Header } from "@/components/Header";
import { SearchBox } from "@/components/SearchBox";

export default function Home() {
  return (
    <main>
      <Header />
      <section className="mx-auto grid min-h-[62vh] w-full max-w-4xl content-center gap-5 px-4 pb-8">
        <div className="max-w-3xl justify-self-center text-center">
          <p className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.24em] text-accent" dir="ltr">ABLibrary + eShia</p>
          <h1 className="font-arabic text-3xl font-bold leading-tight sm:text-4xl">مكتبة بحث هادئة للمصادر الإسلامية الرقمية</h1>
          <p className="mx-auto mt-3 max-w-xl font-arabic text-base leading-7 text-muted">ابحث في مصدرين، افتح الصفحة الأصلية، واقرأ النص داخل واجهة نظيفة تدعم العربية من البداية.</p>
        </div>
        <div className="mx-auto w-full max-w-xl">
          <SearchBox defaultValue="الكافي" />
          <div className="mt-3 grid gap-1.5 font-sans text-[11px] text-muted sm:grid-cols-3" dir="ltr">
            <span className="rounded-lg border border-line bg-paper/60 p-2">Unified search</span>
            <span className="rounded-lg border border-line bg-paper/60 p-2">RTL reader</span>
            <span className="rounded-lg border border-line bg-paper/60 p-2">Live source data</span>
          </div>
        </div>
      </section>
    </main>
  );
}
