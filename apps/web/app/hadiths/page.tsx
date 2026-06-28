import { Header } from "@/components/Header";
import { SearchBox } from "@/components/SearchBox";
import { BookOpenText, HeartHandshake, Search, Sparkles } from "lucide-react";
import Link from "next/link";

const hadithBooks = [
  { id: "1", title: "Al-Kāfi", subtitle: "The Sufficient", author: "Shaykh Muḥammad b. Yaʿqūb al-Kulaynī", featured: true },
  { id: "34", title: "Man Lā Yaḥḍuruh al-Faqīh", subtitle: "He who is without Jurist", author: "Shaykh Muḥammad b. ʿAlī al-Ṣaduq", featured: true },
  { id: "11", title: "ʿUyūn akhbār al-Riḍā", subtitle: "The Source of Traditions on Imam al-Riḍā", author: "Shaykh Muḥammad b. ʿAlī al-Ṣaduq" },
  { id: "14", title: "Al-Tawḥīd", subtitle: "The Book of Divine Unity", author: "Shaykh Muḥammad b. ʿAlī al-Ṣaduq" },
  { id: "24", title: "Kāmil al-Ziyārāt", subtitle: "The Complete Pilgrimage Guide", author: "Shaykh Jaʿfar b. Muḥammad al-Qummī" },
  { id: "10", title: "Al-Khiṣāl", subtitle: "The Book of Characteristics", author: "Shaykh Muḥammad b. ʿAlī al-Ṣaduq" },
  { id: "23", title: "Thawāb al-Aʿmāl wa ʿiqāb al-Aʿmāl", subtitle: "The Rewards & Punishments of Deeds", author: "Shaykh Muḥammad b. ʿAlī al-Ṣaduq" },
  { id: "28", title: "Maʿānī al-ʾAkhbār", subtitle: "The Meanings of Reports", author: "Shaykh Muḥammad b. ʿAlī al-Ṣaduq" },
  { id: "29", title: "Al-Amālī", subtitle: "The Dictations", author: "Shaykh Muḥammad b. ʿAlī al-Ṣaduq" },
  { id: "13", title: "Al-Amālī", subtitle: "The Dictations", author: "Shaykh Muḥammad b. Muḥammad al-Mufīd" },
  { id: "39", title: "Kamāl al-Dīn wa Tamām al-Niʿma", subtitle: "The Perfection of the Religion", author: "Shaykh Muḥammad b. ʿAlī al-Ṣaduq" },
  { id: "27", title: "Kitāb al-Ghayba", subtitle: "The Book of Occultation", author: "Shaykh Muḥammad b. al-Ḥasan al-Ṭūsī" },
  { id: "22", title: "Kitāb al-Ghayba", subtitle: "The Book of Occultation", author: "Abū ʿAbd Allah Muḥammad b. Ibrāhīm al-Nuʿmānī" },
  { id: "9", title: "Muʿjam al-Aḥādīth al-Muʿtabara", subtitle: "Compilation of Authenticated Narrations", author: "Shaykh Muḥammad Āṣif al-Muḥsinī" },
  { id: "32", title: "Nahj al-Balāgha", subtitle: "The Peak of Eloquence", author: "al-Sharīf al-Raḍī" },
  { id: "33", title: "Risālat al-Ḥuqūq", subtitle: "Treatise of Rights", author: "attributed to Imam Zayn al-ʿĀbidīn (a.s)" },
  { id: "17", title: "Kitāb al-Ḍuʿafāʾ", subtitle: "The Weakened Ones", author: "Abū al-Ḥusayn Aḥmad b. al-Ḥusayn al-Ghaḍā'irī" },
  { id: "30", title: "Kitāb al-Muʾmin", subtitle: "The Book of the Believer", author: "Ḥusayn b. Saʿīd al-Ahwāzī" },
  { id: "31", title: "Kitāb al-Zuhd", subtitle: "The Book of Asceticism", author: "Ḥusayn b. Saʿīd al-Ahwāzī" },
  { id: "25", title: "Faḍaʾil al-Shīʿa", subtitle: "Virtues of the Shia", author: "Shaykh Muḥammad b. ʿAlī al-Ṣaduq" },
  { id: "26", title: "Ṣifāt al-Shīʿa", subtitle: "Attributes of the Shia", author: "Shaykh Muḥammad b. ʿAlī al-Ṣaduq" },
];

export default function HadithsPage() {
  const featured = hadithBooks.filter((book) => book.featured);

  return (
    <main className="min-h-screen overflow-hidden">
      <Header />
      <section className="relative mx-auto max-w-6xl px-4 pb-14 pt-4" dir="ltr">
        <div className="absolute inset-x-4 top-0 -z-10 h-80 rounded-[3rem] bg-[radial-gradient(circle_at_25%_15%,rgb(var(--accent)/.28),transparent_17rem),radial-gradient(circle_at_80%_5%,rgb(var(--sheet-soft)),transparent_20rem)] blur-2xl" />

        <div className="grid gap-4 lg:grid-cols-[1.05fr_.95fr] lg:items-stretch">
          <section className="relative overflow-hidden rounded-[2rem] border border-line/80 bg-[rgb(var(--sheet))]/75 p-5 shadow-soft backdrop-blur sm:p-8">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border border-accent/30" />
            <div className="relative flex flex-wrap items-center justify-between gap-3">
              <p className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 font-sans text-xs font-semibold tracking-[0.18em] text-accent">THAQALAYN HADITH</p>
            </div>

            <div className="relative mt-12 max-w-2xl">
              <p className="font-arabic text-2xl font-bold text-accent" dir="rtl">لَبَّيْكَ يَا حُسَيْن</p>
              <h1 className="mt-4 font-sans text-4xl font-bold leading-[1.05] tracking-[-0.045em] sm:text-6xl">
                Hadith collections from Thaqalayn.
              </h1>
              <p className="mt-5 max-w-xl font-sans text-base leading-8 text-muted sm:text-lg">
                A focused doorway into the Thaqalayn hadith shelf: open the major books, search translations, then continue directly into chapters and narrations.
              </p>
            </div>

            <div className="relative mt-8 max-w-2xl">
              <SearchBox defaultSource="thaqalayn" defaultMode="text" placeholder="Search Thaqalayn hadith..." />
            </div>

            <div className="relative mt-8 grid gap-2 sm:grid-cols-3">
              {[
                [BookOpenText, "21", "hadith books"],
                [Search, "Arabic + English", "text search"],
                [Sparkles, "Gradings", "where available"],
              ].map(([Icon, value, label]) => (
                <div key={String(label)} className="rounded-2xl border border-line bg-paper/45 p-3">
                  <Icon className="text-accent" size={18} />
                  <p className="mt-3 font-sans text-lg font-bold text-ink">{String(value)}</p>
                  <p className="font-sans text-xs text-muted">{String(label)}</p>
                </div>
              ))}
            </div>
          </section>

          <aside className="rounded-[2rem] border border-line/80 bg-paper/60 p-4 shadow-soft backdrop-blur sm:p-5">
            <div className="rounded-[1.5rem] border border-line bg-[rgb(var(--sheet))]/75 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-accent">Start here</p>
                  <h2 className="mt-1 font-sans text-2xl font-bold">Core collections</h2>
                </div>
                <HeartHandshake className="text-accent" />
              </div>
              <div className="space-y-3">
                {featured.map((book) => <HadithBookCard key={book.id} book={book} featured />)}
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-5 rounded-[2rem] border border-line/80 bg-[rgb(var(--sheet))]/65 p-4 shadow-soft backdrop-blur sm:p-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-accent">Browse</p>
              <h2 className="mt-1 font-sans text-2xl font-bold">Hadith shelf</h2>
            </div>
            <p className="font-sans text-sm text-muted">Designed after Thaqalayn’s Hadith tab, connected to Maktaba reader routes.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {hadithBooks.map((book) => <HadithBookCard key={book.id} book={book} />)}
          </div>
        </section>
      </section>
    </main>
  );
}

function HadithBookCard({ book, featured = false }: { book: (typeof hadithBooks)[number]; featured?: boolean }) {
  return (
    <Link href={`/books/thaqalayn/${book.id}`} className={`group block min-h-36 rounded-2xl border border-line bg-paper/65 p-4 transition hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-soft ${featured ? "bg-[linear-gradient(135deg,rgb(var(--paper)/.72),rgb(var(--accent)/.12))]" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-sans text-xl font-bold leading-tight tracking-[-0.02em] text-ink">{book.title}</h3>
          <p className="mt-1 font-sans text-sm text-accent">{book.subtitle}</p>
        </div>
        <span className="shrink-0 rounded-full border border-line px-2 py-1 font-sans text-[10px] font-semibold text-muted group-hover:text-ink">#{book.id}</span>
      </div>
      <p className="mt-5 font-sans text-sm leading-6 text-muted">{book.author}</p>
    </Link>
  );
}
