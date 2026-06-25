import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sanad — Hadith Intelligence Platform",
  description: "Every hadith has a chain. Now you can see it.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-white/5 bg-indigo-navy/60 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="font-crimson text-2xl font-semibold text-amber-node">
              سند <span className="text-ivory">Sanad</span>
            </Link>
            <div className="flex gap-6 text-sm text-ivory/80">
              <Link href="/reader" className="hover:text-amber-node">Reader</Link>
              <Link href="/analyze/network" className="hover:text-amber-node">Network</Link>
              <Link href="/explore" className="hover:text-amber-node">Explore</Link>
              <Link href="/dashboard" className="hover:text-amber-node">Dashboard</Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
