"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";

/** Auth-aware nav controls (client island inside the server-rendered header). */
export function NavAuth() {
  const { authed, logout } = useAuth();
  const router = useRouter();

  if (authed) {
    return (
      <button
        onClick={() => {
          logout();
          router.push("/");
        }}
        className="hover:text-amber-node"
      >
        Sign out
      </button>
    );
  }
  return (
    <Link href="/login" className="hover:text-amber-node">
      Sign in
    </Link>
  );
}
