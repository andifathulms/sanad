"use client";

import { useEffect } from "react";
import { recordHistory } from "@/lib/api/auth";
import { useAuth } from "@/lib/hooks/useAuth";

/**
 * Invisible: records a reading-history entry when a signed-in user opens a
 * hadith. Best-effort — failures are swallowed so they never affect the read.
 */
export function RecordHistory({ hadithId }: { hadithId: number }) {
  const { authed } = useAuth();
  useEffect(() => {
    if (authed) recordHistory(hadithId).catch(() => undefined);
  }, [authed, hadithId]);
  return null;
}
