"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { login, register } from "@/lib/api/auth";
import { setTokens } from "@/lib/auth/token";

/** Shared login/register form. mode="login" or "register". */
export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "register") {
        await register({ username, email, password, preferred_locale: "id" });
      }
      const tokens = await login(username, password);
      setTokens(tokens.access, tokens.refresh);
      router.push("/dashboard");
    } catch (err) {
      setError(
        mode === "register"
          ? "Registration failed — username may be taken or password too weak."
          : "Login failed — check your credentials.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="surface mx-auto max-w-sm space-y-4 p-6">
      <h1 className="font-crimson text-2xl font-bold">
        {mode === "login" ? "Sign in" : "Create account"}
      </h1>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        autoComplete="username"
        className="w-full rounded-lg border border-white/10 bg-indigo-deep px-4 py-2 outline-none focus:border-amber-node"
      />
      {mode === "register" && (
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
          autoComplete="email"
          className="w-full rounded-lg border border-white/10 bg-indigo-deep px-4 py-2 outline-none focus:border-amber-node"
        />
      )}
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        type="password"
        autoComplete={mode === "login" ? "current-password" : "new-password"}
        className="w-full rounded-lg border border-white/10 bg-indigo-deep px-4 py-2 outline-none focus:border-amber-node"
      />
      {error && <p className="text-sm text-grade-daif">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-indigo-scholar py-2 font-medium hover:bg-indigo-scholar/80 disabled:opacity-50"
      >
        {busy ? "…" : mode === "login" ? "Sign in" : "Register"}
      </button>
    </form>
  );
}
