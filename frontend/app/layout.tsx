import type { Metadata } from "next";
import Link from "next/link";
import { NavAuth } from "@/components/NavAuth";
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
        <header className="border-b border-white/5 bg-indigo-navy/60 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="font-crimson text-2xl font-semibold text-amber-node">
              سند <span className="text-ivory">Sanad</span>
            </Link>
            <div className="flex gap-6 text-sm text-ivory/80">
              <Link href="/reader" className="hover:text-amber-node">Reader</Link>
              <Link href="/search" className="hover:text-amber-node">Search</Link>
              <Link href="/narrator" className="hover:text-amber-node">Rijal</Link>
              <Link href="/analyze/grades" className="hover:text-amber-node">Grades</Link>
              <Link href="/analyze/network" className="hover:text-amber-node">Network</Link>
              <Link href="/isnad/path" className="hover:text-amber-node">Path</Link>
              <Link href="/isnad/compare" className="hover:text-amber-node">Compare</Link>
              <Link href="/dashboard" className="hover:text-amber-node">Dashboard</Link>
              <NavAuth />
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
