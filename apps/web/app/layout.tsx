import type { Metadata } from "next";
import { Amiri, Vazirmatn } from "next/font/google";
import "./globals.css";

const arabic = Amiri({ subsets: ["arabic"], variable: "--font-arabic", weight: ["400", "700"] });
const sans = Vazirmatn({ subsets: ["arabic"], variable: "--font-sans", weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Maktaba Kit",
  description: "Unified search and reader for ABLibrary and eShia.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${arabic.variable} ${sans.variable}`}>
      <body className="bg-paper text-ink antialiased">
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgb(var(--accent)/.10),transparent_28rem)]">
          {children}
        </div>
      </body>
    </html>
  );
}
