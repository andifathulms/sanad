"use client";

import { useEffect, useState } from "react";
import {
  createCollection,
  listCollections,
  type Collection,
} from "@/lib/api/auth";
import { useAuth } from "@/lib/hooks/useAuth";

export function CollectionsCard() {
  const { authed } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authed) return;
    listCollections()
      .then(setCollections)
      .catch(() => undefined);
  }, [authed]);

  if (!authed) return null;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      const created = await createCollection({ name: trimmed });
      setCollections((prev) => [...prev, created]);
      setName("");
    } catch {
      /* ignore — keep the typed name so the user can retry */
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h2 className="mb-3 font-crimson text-xl text-amber-node">Your collections</h2>
      <form onSubmit={handleCreate} className="mb-3 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New collection name"
          className="surface flex-1 px-3 py-2 text-sm outline-none placeholder:text-ivory/30"
        />
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="rounded bg-indigo-scholar px-4 py-2 text-sm font-medium disabled:opacity-40"
        >
          Create
        </button>
      </form>
      {collections.length === 0 ? (
        <p className="text-ivory/60">No collections yet — create one above.</p>
      ) : (
        <ul className="space-y-2">
          {collections.map((c) => (
            <li key={c.id} className="surface flex items-center justify-between p-4">
              <span className="font-crimson">{c.name}</span>
              <span className="text-xs text-ivory/40">
                {c.items.length} {c.items.length === 1 ? "hadith" : "hadiths"}
                {c.is_public && " · public"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
