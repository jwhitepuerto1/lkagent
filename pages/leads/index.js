// pages/leads/index.js
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export default function LeadsIndexPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  async function loadLeads() {
    setApiError("");
    setLoading(true);
    try {
      const res = await fetch("/api/leads", { cache: "no-store" });

      if (!res.ok) {
        let msg = `API error (${res.status})`;
        try {
          const body = await res.json();
          msg = body?.message || body?.error || msg;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }

      const data = await res.json();

      // Support either:
      // - API returns array: [...]
      // - API returns object: { leads: [...] }
      const list = Array.isArray(data) ? data : (data?.leads ?? []);
      setLeads(Array.isArray(list) ? list : []);
    } catch (err) {
      setApiError(err?.message || "API error");
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
  }, []);

  const sortedLeads = useMemo(() => {
    // simple stable sort: newest-ish first if IDs are random, otherwise keep original order
    return [...leads];
  }, [leads]);

  return (
    <div style={{ padding: 24, maxWidth: 980 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Leads</h1>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={loadLeads} style={{ padding: "8px 12px" }}>
            Refresh
          </button>

          <Link href="/leads/new" style={{ padding: "8px 12px", border: "1px solid #333", borderRadius: 6 }}>
            + New Lead
          </Link>
        </div>
      </div>

      {apiError ? (
        <p style={{ color: "crimson", marginTop: 8 }}>API error: {apiError}</p>
      ) : null}

      {loading ? (
        <p style={{ marginTop: 16 }}>Loading…</p>
      ) : sortedLeads.length === 0 ? (
        <p style={{ marginTop: 16 }}>No leads yet.</p>
      ) : (
        <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
          {sortedLeads.map((l) => (
            <div
              key={l.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 10,
                padding: 12,
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700 }}>
                  <Link href={`/leads/${l.id}`}>{l.name || l.id}</Link>
                </div>

                <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>
                  <span>Id: {l.id}</span>{" "}
                  {l.segment ? <>• Segment: {l.segment}</> : null}{" "}
                  {l.stage ? <>• Stage: {l.stage}</> : null}{" "}
                  {l.status ? <>• Status: {l.status}</> : null}
                </div>
              </div>

              <div style={{ textAlign: "right", fontSize: 13, opacity: 0.85 }}>
                {l.owner ? <div>Owner: {l.owner}</div> : null}
                {l.priority ? <div>Priority: {l.priority}</div> : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
