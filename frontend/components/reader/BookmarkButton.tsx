"use client";

import { useEffect, useState } from "react";
import { addBookmark, listBookmarks, removeBookmark, type Bookmark } from "@/lib/api/auth";
import { useAuth } from "@/lib/hooks/useAuth";

/** Toggle a bookmark for a hadith. Hidden until the user is authenticated. */
export function BookmarkButton({ hadithId }: { hadithId: number }) {
  const { authed } = useAuth();
  const [bookmark, setBookmark] = useState<Bookmark | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authed) {
      setBookmark(null);
      return;
    }
    listBookmarks()
      .then((bs) => setBookmark(bs.find((b) => b.hadith === hadithId) ?? null))
      .catch(() => setBookmark(null));
  }, [authed, hadithId]);

  if (!authed) return null;

  async function toggle() {
    setBusy(true);
    try {
      if (bookmark) {
        await removeBookmark(bookmark.id);
        setBookmark(null);
      } else {
        setBookmark(await addBookmark(hadithId));
      }
    } catch {
      /* surfaced elsewhere */
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      title={bookmark ? "Remove bookmark" : "Bookmark this hadith"}
      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:border-amber-node/50 disabled:opacity-50"
    >
      <span className={bookmark ? "text-amber-node" : "text-ivory/50"}>
        {bookmark ? "★" : "☆"}
      </span>
      {bookmark ? "Saved" : "Save"}
    </button>
  );
}
