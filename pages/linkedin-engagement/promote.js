// pages/linkedin-engagement/promote.js
import { useEffect, useState } from "react";
import Layout from "../../components/Layout";

const btn = { padding: "8px 14px", marginRight: 8 };

export default function PromotePage() {
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setError("");
    try {
      const [candidatesRes, exportRes] = await Promise.all([
        fetch("/api/linkedin-engagement/profiles-search?status=ENGAGEMENT_REVIEW,CONVERSATION_ACTIVE,LINKEDIN_LEAD,FOLLOW_UP_DUE", { cache: "no-store" }),
        fetch("/api/linkedin-engagement/export", { cache: "no-store" }),
      ]);
      const candidatesData = await candidatesRes.json();
      const exportData = await exportRes.json();
      if (!candidatesRes.ok) throw new Error(candidatesData.message || candidatesData.error);
      if (!exportRes.ok) throw new Error(exportData.message || exportData.error);
      setCandidates(candidatesData);
      setPending(exportData.pending);
      setHistory(exportData.history);
    } catch (e) {
      setError(e.message);
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

  async function promoteSelected() {
    if (selected.size === 0) return;
    const reason = window.prompt(`Reason for promoting ${selected.size} record(s)?`);
    if (!reason) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/linkedin-engagement/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileIds: [...selected], reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);
      setSelected(new Set());
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function downloadCsv() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/linkedin-engagement/export", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.error);
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="(.+)"/);
      const fileName = match ? match[1] : "linkedin-promoted.csv";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout>
      <h1>Promote to CRE Prospect</h1>
      <p style={{ fontSize: 13, opacity: 0.75 }}>
        Selecting a record here does not send anything anywhere. It flags the record and, once exported, produces
        a CSV with the exact column headers ias_cre_agent expects
        (C:\Users\jwhit\IAspecmodule\ias_cre_agent) - you submit that file there yourself.
      </p>

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

      <h3>Candidates ({candidates.length})</h3>
      <button style={btn} disabled={busy || selected.size === 0} onClick={promoteSelected}>
        Promote Selected ({selected.size})
      </button>
      <div style={{ display: "grid", gap: 6, marginTop: 10 }}>
        {candidates.map((p) => (
          <label key={p.id} style={{ display: "flex", gap: 10, alignItems: "center", border: "1px solid #eee", borderRadius: 6, padding: 8 }}>
            <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} />
            <div>
              <strong>{p.fullName || p.linkedinUrn}</strong>{" "}
              <span style={{ fontSize: 12, opacity: 0.7 }}>
                {p.primaryCategory} • priority {p.priorityScore ?? "—"} • {p.status}
              </span>
              <div style={{ fontSize: 12, opacity: 0.6 }}>{p.headline}</div>
            </div>
          </label>
        ))}
        {candidates.length === 0 ? <p style={{ opacity: 0.6 }}>No candidates right now.</p> : null}
      </div>

      <h3 style={{ marginTop: 28 }}>Ready to export ({pending.length} promoted, not yet exported)</h3>
      <button style={btn} disabled={busy || pending.length === 0} onClick={downloadCsv}>
        Download CSV
      </button>
      <ul style={{ fontSize: 13 }}>
        {pending.map((p) => (
          <li key={p.id}>{p.fullName || p.linkedinUrn} - {p.promotionReason}</li>
        ))}
      </ul>

      <h3 style={{ marginTop: 28 }}>Export history</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>
            <th style={{ padding: 6 }}>File</th>
            <th style={{ padding: 6 }}>Records</th>
            <th style={{ padding: 6 }}>Exported</th>
          </tr>
        </thead>
        <tbody>
          {history.map((h) => (
            <tr key={h.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 6 }}>{h.fileName}</td>
              <td style={{ padding: 6 }}>{h.recordCount}</td>
              <td style={{ padding: 6 }}>{new Date(h.exportedAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
}
