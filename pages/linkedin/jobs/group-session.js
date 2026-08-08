// pages/linkedin/jobs/group-session.js
// Spec §7.8: one Group at a time, exact approved copy, operator confirms.
import { useEffect, useState } from "react";
import Link from "next/link";
import Layout from "../../../components/Layout";

const btn = { padding: "8px 14px", marginRight: 8 };

export default function GroupSessionPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [postUrl, setPostUrl] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/linkedin/jobs?destinationType=GROUP&status=AWAITING_HUMAN", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed to load");
      setJobs(data);
      setPostUrl("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function runPrecheckOnDue() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/linkedin/jobs?destinationType=GROUP&status=QUEUED,BLOCKED", { cache: "no-store" });
      const due = await res.json();
      for (const job of due) {
        await fetch(`/api/linkedin/jobs/${job.id}/precheck`, { method: "POST" });
      }
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    if (!current || !postUrl) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/linkedin/jobs/${current.id}/confirm-publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Confirm failed");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function skipCurrent() {
    const reason = window.prompt("Reason to skip this group?");
    if (!reason) return;
    setBusy(true);
    try {
      await fetch(`/api/linkedin/jobs/${current.id}/skip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  const current = jobs[0];

  return (
    <Layout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Group Session</h1>
        <Link href="/linkedin/jobs">Back to full queue</Link>
      </div>

      <div style={{ marginBottom: 12 }}>
        <button style={btn} disabled={busy} onClick={runPrecheckOnDue}>Prepare due groups (run precheck)</button>
        <button style={btn} disabled={busy} onClick={load}>Refresh</button>
      </div>

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

      {loading ? (
        <p>Loading…</p>
      ) : !current ? (
        <p>No Group posts are ready for confirmation right now. Click &quot;Prepare due groups&quot; to run precheck on queued jobs.</p>
      ) : (
        <div style={{ maxWidth: 640, border: "1px solid #ddd", borderRadius: 10, padding: 16 }}>
          <h2 style={{ marginTop: 0 }}>{current.destination?.name}</h2>
          <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 10 }}>
            {current.campaign?.campaignName} • scheduled {new Date(current.publishDate).toLocaleDateString()}
            {current.destination?.rulesSummary ? <div>Rules: {current.destination.rulesSummary}</div> : null}
          </div>

          <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 12, whiteSpace: "pre-wrap", background: "#fafafa" }}>
            {current.contentTextSnapshot}
          </div>

          <input
            placeholder="Paste the resulting LinkedIn post URL"
            value={postUrl}
            onChange={(e) => setPostUrl(e.target.value)}
            style={{ width: "100%", padding: "8px 10px", marginTop: 12 }}
          />

          <div style={{ marginTop: 12 }}>
            <button style={btn} disabled={busy || !postUrl} onClick={confirm}>Confirm published</button>
            <button style={btn} disabled={busy} onClick={skipCurrent}>Skip this group</button>
          </div>

          <p style={{ fontSize: 12, opacity: 0.6, marginTop: 10 }}>{jobs.length - 1} more group(s) queued after this one.</p>
        </div>
      )}
    </Layout>
  );
}
