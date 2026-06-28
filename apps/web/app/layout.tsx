import type { Metadata } from "next";
import { Amiri, Inter, Vazirmatn } from "next/font/google";
import "./globals.css";

const arabic = Amiri({ subsets: ["arabic"], variable: "--font-arabic", weight: ["400", "700"] });
const arabicSans = Vazirmatn({ subsets: ["arabic"], variable: "--font-arabic-sans", weight: ["400", "500", "600", "700"] });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans", weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "Maktaba Kit",
  description: "Unified search and reader for ABLibrary and eShia.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${arabic.variable} ${arabicSans.variable} ${sans.variable}`} suppressHydrationWarning>
      <body className="bg-paper text-ink antialiased">
        <script dangerouslySetInnerHTML={{ __html: readerSettingsScript }} />
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgb(var(--accent)/.10),transparent_28rem)]">
          {children}
        </div>
      </body>
    </html>
  );
}

const readerSettingsScript = `
try {
  const settings = JSON.parse(localStorage.getItem("maktaba-reader-settings") || "{}");
  const root = document.documentElement;
  root.classList.toggle("light", settings.theme === "light");
  root.classList.toggle("sepia", settings.theme === "sepia");
  if (settings.size) root.dataset.readerSize = settings.size;
  if (settings.leading) root.dataset.readerLeading = settings.leading;
  if (settings.width) root.dataset.readerWidth = settings.width;
  if (settings.columns) root.dataset.readerColumns = settings.columns;
  if (settings.font) root.dataset.readerFont = settings.font;
} catch {}
`;
