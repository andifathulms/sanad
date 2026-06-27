import type { Metadata } from "next";
import Link from "next/link";
import { NavMenu } from "@/components/NavMenu";
import { ReaderSettingsMenu } from "@/components/reader/ReaderSettingsMenu";
import { ReaderSettingsProvider } from "@/lib/hooks/useReaderSettings";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sanad — Hadith Intelligence Platform",
  description: "Every hadith has a chain. Now you can see it.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Loaded by the browser at runtime, not Next's CSS build. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Crimson+Pro:wght@400;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono&family=IBM+Plex+Sans+Arabic:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ReaderSettingsProvider>
          <header className="relative border-b border-white/5 bg-indigo-navy/60 backdrop-blur">
            <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4">
              <Link href="/" className="font-crimson text-2xl font-semibold text-amber-node">
                سند <span className="text-ivory">Sanad</span>
              </Link>
              <div className="flex items-center gap-1">
                <NavMenu />
                <ReaderSettingsMenu />
              </div>
            </nav>
          </header>
          <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
        </ReaderSettingsProvider>
      </body>
    </html>
  );
}
