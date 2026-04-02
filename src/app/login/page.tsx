"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin1");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error || "Login failed");
      setLoading(false);
      return;
    }

    router.push("/select-day");
    router.refresh();
  }

  return (
    <main className="min-h-screen p-3 sm:p-8 flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl bg-[var(--card)] shadow-xl shadow-slate-200/70 border border-white/70 p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent)] font-semibold">GBM FEST 2026</p>
        <h1 className="text-2xl sm:text-3xl font-bold mt-2">Gate Entry Admin Login</h1>
        <p className="text-sm text-slate-600 mt-2">Use one of 4 admin accounts to operate on any phone.</p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium">
            Username
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>

          <label className="block text-sm font-medium">
            Password
            <input
              type="password"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[var(--accent)] text-white font-semibold py-2.5 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

      </div>
    </main>
  );
}
