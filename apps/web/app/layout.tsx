import type { Metadata } from "next";
import { Noto_Naskh_Arabic, Inter } from "next/font/google";
import "./globals.css";

const arabic = Noto_Naskh_Arabic({ subsets: ["arabic"], variable: "--font-arabic", weight: ["400", "500", "600", "700"] });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Maktaba Kit",
  description: "Unified search and reader for ABLibrary and eShia.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${arabic.variable} ${sans.variable}`}>
      <body className="bg-paper text-ink antialiased">
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgb(var(--accent)/.11),transparent_34rem)]">
          {children}
        </div>
      </body>
    </html>
  );
}
