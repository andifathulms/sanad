"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listBookmarks, me, type Bookmark } from "@/lib/api/auth";
import { useAuth } from "@/lib/hooks/useAuth";

export default function DashboardPage() {
  const { authed } = useAuth();
  const [username, setUsername] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!authed) {
      setLoaded(true);
      return;
    }
    Promise.all([me(), listBookmarks()])
      .then(([u, bs]) => {
        setUsername(u.username);
        setBookmarks(bs);
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, [authed]);

  if (loaded && !authed) {
    return (
      <p className="surface p-6">
        Please{" "}
        <Link href="/login" className="text-amber-node hover:underline">
          sign in
        </Link>{" "}
        to view your dashboard.
      </p>
    );
  }

  return (
    <section className="space-y-6">
      <h1 className="font-crimson text-3xl font-bold">
        {username ? `Welcome, ${username}` : "Dashboard"}
      </h1>
      <div>
        <h2 className="mb-3 font-crimson text-xl text-amber-node">Your bookmarks</h2>
        {bookmarks.length === 0 ? (
          <p className="text-ivory/60">No bookmarks yet — save a hadith from the reader.</p>
        ) : (
          <ul className="space-y-2">
            {bookmarks.map((b) => (
              <li key={b.id} className="surface flex items-center justify-between p-4">
                <Link href={`/reader/_/${b.hadith}`} className="font-mono text-sm hover:text-amber-node">
                  Hadith #{b.hadith}
                </Link>
                <span className="text-xs text-ivory/40">
                  {new Date(b.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
