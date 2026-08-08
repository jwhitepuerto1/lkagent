// pages/members/register.js
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

export default function MemberRegisterPage() {
  const router = useRouter();
  const nextPath = typeof router.query.next === "string" ? router.query.next : "/members/account";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      const r = await fetch("/api/members/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ firstName, lastName, email, password }),
      });

      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data?.ok) {
        setError(data?.error || `Registration failed (${r.status})`);
        setBusy(false);
        return;
      }

      window.location.href = nextPath || "/members/account";
    } catch (err) {
      setError(err?.message || "Registration failed");
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 520 }}>
      <h1 style={{ marginTop: 0 }}>Create your account</h1>
      {error ? <div style={{ color: "crimson", marginBottom: 12 }}>{error}</div> : null}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <label>
          First name
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }}
            autoFocus
          />
        </label>

        <label>
          Last name
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }}
          />
        </label>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }}
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }}
          />
        </label>

        <button type="submit" disabled={busy} style={{ padding: "10px 12px" }}>
          {busy ? "Creating account…" : "Create account"}
        </button>
      </form>

      <div style={{ marginTop: 10, fontSize: 13 }}>
        Already have an account? <Link href="/members/login">Sign in</Link>
      </div>
    </div>
  );
}
