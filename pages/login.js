// pages/login.js
import { useRouter } from "next/router";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const nextPath = typeof router.query.next === "string" ? router.query.next : "/leads";

  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });

      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data?.ok) {
        setError(data?.error || data?.message || `Login failed (${r.status})`);
        setBusy(false);
        return;
      }

      // Confirm cookie is now recognized
      const me = await fetch("/api/auth/me", { cache: "no-store", credentials: "include" });
      if (!me.ok) {
        setError("Login succeeded but session not recognized. Clear cookies + restart server.");
        setBusy(false);
        return;
      }

      window.location.href = nextPath || "/leads";
    } catch (err) {
      setError(err?.message || "Login failed");
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 520 }}>
      <h1 style={{ marginTop: 0 }}>Sign in</h1>
      {error ? <div style={{ color: "crimson", marginBottom: 12 }}>{error}</div> : null}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }}
            autoFocus
          />
        </label>

        <button type="submit" disabled={busy} style={{ padding: "10px 12px" }}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div style={{ marginTop: 10, opacity: 0.7, fontSize: 13 }}>
        Use only <b>http://localhost:3000</b> (don’t mix with 127.0.0.1).
      </div>
    </div>
  );
}
