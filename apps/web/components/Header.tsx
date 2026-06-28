import { BookOpen, Search, Tags } from "lucide-react";
import Link from "next/link";

export function Header({ hideSearch = false }: { hideSearch?: boolean }) {
  return (
    <header className="mx-auto flex h-12 w-full max-w-4xl items-center justify-between px-4" dir="ltr">
      <Link href="/" className="font-sans text-sm font-semibold tracking-[0.22em] text-ink">MAKTABA KIT</Link>
      <nav className="flex items-center gap-1 font-sans text-sm text-muted sm:gap-4">
        {!hideSearch && (
          <Link aria-label="Search" className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full hover:bg-ink/5 hover:text-ink sm:min-h-0 sm:min-w-0 sm:rounded-none" href="/search">
            <Search size={18} className="sm:hidden" />
            <span className="hidden sm:inline">Search</span>
          </Link>
        )}
        <Link aria-label="Categories" className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full hover:bg-ink/5 hover:text-ink sm:min-h-0 sm:min-w-0 sm:rounded-none" href="/categories">
          <Tags size={18} className="sm:hidden" />
          <span className="hidden sm:inline">Categories</span>
        </Link>
        <Link aria-label="Library" className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full hover:bg-ink/5 hover:text-ink sm:min-h-0 sm:min-w-0 sm:rounded-none" href="/library">
          <BookOpen size={18} className="sm:hidden" />
          <span className="hidden sm:inline">Library</span>
        </Link>
      </nav>
    </header>
  );
}
