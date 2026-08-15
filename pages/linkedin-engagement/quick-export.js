// pages/linkedin-engagement/quick-export.js
// Simple list-and-export view over every retrieved EngagementProfile, for a
// fast CSV in the ias_cre_agent import format (same columns as /promote's
// export, see lib/linkedinEngagement/csvExport.js) without going through
// that page's status filtering, reason prompt, or promotion/export
// history-tracking. Independent of /promote - a profile can be exported
// here and separately promoted, or neither; this endpoint never mutates a
// profile's status.
import { useEffect, useState } from "react";
import Layout from "../../components/Layout";

const btn = { padding: "8px 14px", marginRight: 8 };

export default function QuickExportPage() {
  const [profiles, setProfiles] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/linkedin-engagement/profiles-search", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed to load profiles");
      setProfiles(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === profiles.length ? new Set() : new Set(profiles.map((p) => p.id))));
  }

  async function downloadCsv() {
    if (selected.size === 0) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/linkedin-engagement/export-quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileIds: [...selected] }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.error);
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="(.+)"/);
      const fileName = match ? match[1] : "linkedin-quick-export.csv";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout>
      <h1>Quick Export</h1>
      <p style={{ fontSize: 13, opacity: 0.75, maxWidth: 720 }}>
        Everything this agent has retrieved via LinkedIn engagement tracking. Select records and
        download a CSV in the same column format ias_cre_agent expects (the CRE prospect
        database) - identical headers to /promote&apos;s export, but skips that page&apos;s status
        filter, reason prompt, and export-history tracking for a fast one-off pull.
      </p>

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

      <div style={{ margin: "10px 0" }}>
        <button style={btn} onClick={toggleAll} disabled={loading || profiles.length === 0}>
          {selected.size === profiles.length && profiles.length > 0 ? "Deselect all" : "Select all"}
        </button>
        <button style={btn} disabled={busy || selected.size === 0} onClick={downloadCsv}>
          {busy ? "Preparing…" : `Download CSV (${selected.size})`}
        </button>
        <button style={btn} onClick={load} disabled={loading}>Refresh</button>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : profiles.length === 0 ? (
        <p style={{ opacity: 0.6 }}>No profiles retrieved yet.</p>
      ) : (
        <div style={{ display: "grid", gap: 6 }}>
          {profiles.map((p) => (
            <label
              key={p.id}
              style={{ display: "flex", gap: 10, alignItems: "center", border: "1px solid #eee", borderRadius: 6, padding: 8 }}
            >
              <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} />
              <div>
                <strong>{p.fullName || p.linkedinUrn}</strong>{" "}
                <span style={{ fontSize: 12, opacity: 0.7 }}>
                  {p.primaryCategory || "uncategorized"} • {p.status}
                </span>
                <div style={{ fontSize: 12, opacity: 0.6 }}>{p.headline}</div>
              </div>
            </label>
          ))}
        </div>
      )}
    </Layout>
  );
}
