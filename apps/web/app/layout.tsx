import type { Metadata } from "next";
import Script from "next/script";
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
        <Script id="reader-settings" strategy="beforeInteractive">{readerSettingsScript}</Script>
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgb(var(--accent)/.10),transparent_28rem)]">
          {children}
        </div>
      </body>
    </html>
  );
}

const readerSettingsScript = `
try {
  var s = JSON.parse(localStorage.getItem("maktaba-reader-settings") || "{}");
  var r = document.documentElement;
  if (s.theme === "light") r.classList.add("light");
  if (s.theme === "sepia") r.classList.add("sepia");
  if (s.size) r.dataset.readerSize = s.size;
  if (s.leading) r.dataset.readerLeading = s.leading;
  if (s.width) r.dataset.readerWidth = s.width;
  if (s.columns) r.dataset.readerColumns = s.columns;
  if (s.font) r.dataset.readerFont = s.font;
} catch (e) { console.warn("[maktaba] reader settings init failed:", e); }
`;
