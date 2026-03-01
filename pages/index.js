// pages/index.js
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [counts, setCounts] = useState({ leads: 0, due: 0, upcoming: 0 });
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setError("");
      try {
        const [leadsRes, tasksRes] = await Promise.all([
          fetch("/api/leads", { cache: "no-store" }),
          fetch("/api/tasks", { cache: "no-store" }),
        ]);

        const leadsJson = await leadsRes.json().catch(() => null);
        const tasksJson = await tasksRes.json().catch(() => null);

        if (!leadsRes.ok) throw new Error(leadsJson?.error || `Leads API error (${leadsRes.status})`);
        if (!tasksRes.ok) throw new Error(tasksJson?.error || `Tasks API error (${tasksRes.status})`);

        const leadsCount = Array.isArray(leadsJson) ? leadsJson.length : (leadsJson?.leads?.length ?? 0);
        setCounts({
          leads: leadsCount,
          due: tasksJson?.counts?.due ?? 0,
          upcoming: tasksJson?.counts?.upcoming ?? 0,
        });
      } catch (e) {
        setError(e?.message || "Failed to load dashboard");
      }
    }

    load();
  }, []);

  return (
    <div style={{ padding: 24, maxWidth: 980 }}>
      <h1 style={{ marginTop: 0 }}>IAS V1</h1>

      {error ? <div style={{ color: "crimson", marginTop: 8 }}>{error}</div> : null}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 16 }}>
        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 14 }}>
          <h2 style={{ marginTop: 0 }}>Leads</h2>
          <div style={{ opacity: 0.8, marginBottom: 10 }}>{counts.leads} total</div>
          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/leads">Open Leads</Link>
            <span style={{ opacity: 0.5 }}>•</span>
            <Link href="/leads/new">New Lead</Link>
          </div>
        </div>

        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 14 }}>
          <h2 style={{ marginTop: 0 }}>Tasks</h2>
          <div style={{ opacity: 0.8, marginBottom: 10 }}>
            {counts.due} due • {counts.upcoming} upcoming
          </div>
          <Link href="/tasks">Open Tasks</Link>
        </div>
      </div>

      <div style={{ marginTop: 22, border: "1px solid #eee", borderRadius: 12, padding: 14 }}>
        <h3 style={{ marginTop: 0 }}>What’s in V1</h3>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>Leads CRUD (create/list/view/edit)</li>
          <li>Tasks view based on Next Action Date</li>
          <li>Complete/Snooze task logs Activity + updates Lead</li>
          <li>Activities Timeline per Lead</li>
        </ul>
      </div>
    </div>
  );
}
