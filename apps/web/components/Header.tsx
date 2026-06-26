import Link from "next/link";

export function Header() {
  return (
    <header className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-3" dir="ltr">
      <Link href="/" className="font-sans text-sm font-semibold tracking-[0.22em] text-ink">MAKTABA KIT</Link>
      <nav className="flex gap-4 font-sans text-sm text-muted">
        <Link className="hover:text-ink" href="/search?q=الكافي">Search</Link>
        <Link className="hover:text-ink" href="/books?q=الكافي">Books</Link>
      </nav>
    </header>
  );
}
