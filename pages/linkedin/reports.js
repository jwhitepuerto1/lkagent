// pages/linkedin/reports.js
import { useEffect, useState } from "react";
import Layout from "../../components/Layout";

export default function ReportsPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/linkedin/reports/summary", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || data.error || "Failed to load report");
        setSummary(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !summary) {
    return <Layout>{error ? <p style={{ color: "crimson" }}>{error}</p> : <p>Loading…</p>}</Layout>;
  }

  const statuses = Object.keys(summary.totalByStatus);

  return (
    <Layout>
      <h1>Publishing Reports</h1>
      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

      <h3>Totals</h3>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {statuses.map((s) => (
          <div key={s} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, minWidth: 120 }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{s}</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{summary.totalByStatus[s]}</div>
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: 24 }}>By campaign</h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>
            <th style={{ padding: 6 }}>Campaign</th>
            <th style={{ padding: 6 }}>Counts by status</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(summary.byCampaign).map(([campaignId, row]) => (
            <tr key={campaignId} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 6 }}>{row.campaignName}</td>
              <td style={{ padding: 6, fontSize: 13 }}>
                {Object.entries(row.counts).map(([s, n]) => `${s}: ${n}`).join(" • ")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ marginTop: 24 }}>By destination</h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>
            <th style={{ padding: 6 }}>Destination</th>
            <th style={{ padding: 6 }}>Type</th>
            <th style={{ padding: 6 }}>Counts by status</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(summary.byDestination).map(([destId, row]) => (
            <tr key={destId} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 6 }}>{row.destinationName}</td>
              <td style={{ padding: 6 }}>{row.destinationType}</td>
              <td style={{ padding: 6, fontSize: 13 }}>
                {Object.entries(row.counts).map(([s, n]) => `${s}: ${n}`).join(" • ")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
}
