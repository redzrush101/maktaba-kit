import { Header } from "@/components/Header";
import { SearchBox } from "@/components/SearchBox";
import Link from "next/link";

const examples = ["الكافي", "إنما الأعمال", "التفويض", "الحمد"];
const shelves = [
  ["ABLibrary", "فهارس عربية منظّمة", "كتب، صفحات، وفهارس مباشرة من المصدر."],
  ["eShia", "مجلدات وصفحات حية", "قراءة بالنص والحواشي وروابط الأصل."],
  ["Reader", "إعدادات قراءة هادئة", "حجم الخط، السطر، العرض، الثيم، والأعمدة."],
];

export default function Home() {
  return (
    <main className="overflow-hidden">
      <Header />
      <section className="relative mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-8 px-4 pb-10 pt-4 lg:grid-cols-[1.05fr_.95fr]">
        <div className="pointer-events-none absolute inset-x-4 top-8 -z-10 h-72 rounded-[3rem] bg-[radial-gradient(circle_at_70%_20%,rgb(var(--accent)/.24),transparent_18rem)] blur-2xl" />

        <div className="relative rounded-[2rem] border border-line/80 bg-[rgb(var(--sheet))]/70 p-5 shadow-soft backdrop-blur sm:p-7" dir="rtl">
          <div className="absolute -left-5 -top-5 hidden h-24 w-24 rounded-full border border-accent/40 bg-paper/50 sm:block" />
          <p className="mb-4 w-fit rounded-full border border-accent/40 bg-accent/10 px-3 py-1 font-sans text-xs font-semibold tracking-[0.18em] text-accent" dir="ltr">LIVE ISLAMIC LIBRARY</p>
          <h1 className="max-w-3xl font-arabic text-4xl font-bold leading-[1.25] sm:text-5xl lg:text-6xl">
            اقرأ كأنك أمام رفّ كتب، لا أمام محرّك بحث.
          </h1>
          <p className="mt-5 max-w-2xl font-arabic text-lg leading-9 text-muted">
            مكتبة موحّدة للبحث والقراءة في ABLibrary و eShia، مع فهارس، صفحات أصلية، وحالة قراءة مصمّمة للنص العربي والفارسي الطويل.
          </p>

          <div className="mt-7 max-w-2xl">
            <SearchBox defaultValue="الكافي" />
            <div className="mt-3 flex flex-wrap gap-2 font-arabic text-sm text-muted">
              {examples.map((q) => <Link key={q} href={`/search?q=${encodeURIComponent(q)}`} className="rounded-full border border-line bg-paper/50 px-3 py-1.5 hover:text-ink">{q}</Link>)}
            </div>
          </div>

          <div className="mt-8 grid gap-2 sm:grid-cols-3" dir="ltr">
            {shelves.map(([label, title, text]) => (
              <div key={label} className="rounded-2xl border border-line bg-paper/45 p-3">
                <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">{label}</p>
                <h2 className="mt-2 font-arabic text-lg font-bold" dir="rtl">{title}</h2>
                <p className="mt-1 font-arabic text-sm leading-6 text-muted" dir="rtl">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative hidden lg:block" aria-hidden="true">
          <div className="library-arch mx-auto h-[34rem] max-w-md rounded-t-[13rem] border border-line bg-[rgb(var(--sheet))]/80 p-5 shadow-soft">
            <div className="h-full rounded-t-[11rem] border border-line/80 bg-paper/40 p-5">
              <div className="mt-14 space-y-3">
                {[
                  ["الكافي", "11005 / 1 / 2", "w-10/12"],
                  ["نهج البلاغة", "خطبة · صفحة", "w-8/12"],
                  ["وسائل الشيعة", "volume index", "w-11/12"],
                  ["بحار الأنوار", "search result", "w-9/12"],
                  ["تهذيب الأحكام", "toc", "w-7/12"],
                ].map(([title, meta, width], i) => (
                  <div key={title} className={`${width} ${i % 2 ? "mr-auto" : ""} rounded-xl border border-line bg-[rgb(var(--sheet-soft))] p-4`}>
                    <div className="flex items-center justify-between gap-3" dir="rtl">
                      <span className="font-arabic text-xl font-bold">{title}</span>
                      <span className="h-8 w-2 rounded-full bg-accent/70" />
                    </div>
                    <p className="mt-2 font-sans text-xs text-muted" dir="ltr">{meta}</p>
                  </div>
                ))}
              </div>
              <div className="mx-auto mt-10 h-px w-3/4 bg-line" />
              <p className="mt-5 text-center font-arabic text-sm text-muted">رفّ حيّ: افتح الكتاب، انتقل للصفحة، ثم ارجع للفهرس.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
