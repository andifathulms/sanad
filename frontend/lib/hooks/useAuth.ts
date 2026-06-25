"use client";

import { useEffect, useState } from "react";
import { clearTokens, isAuthenticated } from "@/lib/auth/token";

/** Reactive auth state — re-renders on the 'sanad-auth' event from token.ts. */
export function useAuth() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const sync = () => setAuthed(isAuthenticated());
    sync();
    window.addEventListener("sanad-auth", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("sanad-auth", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { authed, logout: clearTokens };
}
