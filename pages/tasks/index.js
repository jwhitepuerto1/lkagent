// pages/tasks/index.js
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

function fmt(d) {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "" : dt.toLocaleString();
}

export default function TasksPage() {
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("All");
  const [owner, setOwner] = useState("All");
  const [priority, setPriority] = useState("All");

  const [activeOnly, setActiveOnly] = useState(true);
  const [hideWithoutNextAction, setHideWithoutNextAction] = useState(true);
  const [dueOnly, setDueOnly] = useState(false);

  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [dueNow, setDueNow] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [counts, setCounts] = useState({ due: 0, upcoming: 0 });

  // UI state for task completion actions
  const [busyLeadId, setBusyLeadId] = useState("");
  const [actionError, setActionError] = useState("");

  async function load() {
    setLoading(true);
    setApiError("");
    setActionError("");

    const params = new URLSearchParams({
      search,
      stage,
      owner,
      priority,
      activeOnly: String(activeOnly),
      hideWithoutNextAction: String(hideWithoutNextAction),
      dueOnly: String(dueOnly),
    });

    try {
      const res = await fetch(`/api/tasks?${params.toString()}`, { cache: "no-store" });

      if (!res.ok) {
        let msg = `API error (${res.status})`;
        try {
          const body = await res.json();
          msg = body?.message || body?.error || msg;
        } catch {}
        throw new Error(msg);
      }

      const data = await res.json();
      setDueNow(Array.isArray(data?.dueNow) ? data.dueNow : []);
      setUpcoming(Array.isArray(data?.upcoming) ? data.upcoming : []);
      setCounts(data?.counts || { due: 0, upcoming: 0 });
    } catch (e) {
      setApiError(e?.message || "API error");
      setDueNow([]);
      setUpcoming([]);
      setCounts({ due: 0, upcoming: 0 });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, stage, owner, priority, activeOnly, hideWithoutNextAction, dueOnly]);

  const ownerOptions = useMemo(() => {
    const all = [...dueNow, ...upcoming];
    const set = new Set(all.map((x) => x.owner).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [dueNow, upcoming]);

  function clearFilters() {
    setSearch("");
    setStage("All");
    setOwner("All");
    setPriority("All");
    setActiveOnly(true);
    setHideWithoutNextAction(true);
    setDueOnly(false);
  }

  async function completeTask(leadId, snoozeDays) {
    if (!leadId) return;
    setActionError("");
    setBusyLeadId(leadId);

    try {
      const note =
        snoozeDays && snoozeDays > 0
          ? `Completed task (snoozed ${snoozeDays}d)`
          : "Completed task";

      const res = await fetch(`/api/leads/${encodeURIComponent(leadId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete_task",
          snoozeDays,
          note,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || `Failed (${res.status})`);

      // Refresh the tasks list after completion/snooze
      await load();
    } catch (e) {
      setActionError(e?.message || "Failed to complete task");
    } finally {
      setBusyLeadId("");
    }
  }

  function TaskCard({ l }) {
    const isBusy = busyLeadId === l.id;

    return (
      <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700 }}>
              <Link href={`/leads/${l.id}`}>{l.name || l.id}</Link>
            </div>
            <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>
              {l.id} • {l.owner} • {l.stage} • {l.priority} • Next: {fmt(l.nextActionAt)}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => completeTask(l.id, 0)}
              disabled={isBusy}
              style={{ padding: "8px 10px" }}
              title="Mark complete and clear Next Action"
            >
              {isBusy ? "Working…" : "Complete"}
            </button>

            <button
              onClick={() => completeTask(l.id, 1)}
              disabled={isBusy}
              style={{ padding: "8px 10px" }}
              title="Complete and snooze 1 day"
            >
              Snooze 1d
            </button>

            <button
              onClick={() => completeTask(l.id, 3)}
              disabled={isBusy}
              style={{ padding: "8px 10px" }}
              title="Complete and snooze 3 days"
            >
              Snooze 3d
            </button>

            <button
              onClick={() => completeTask(l.id, 7)}
              disabled={isBusy}
              style={{ padding: "8px 10px" }}
              title="Complete and snooze 7 days"
            >
              Snooze 7d
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Tasks</h1>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={load} style={{ padding: "8px 12px" }}>
            Refresh
          </button>
          <div style={{ opacity: 0.8 }}>
            {counts.due} due • {counts.upcoming} upcoming
          </div>
        </div>
      </div>

      {apiError ? <div style={{ color: "crimson", marginTop: 8 }}>API error: {apiError}</div> : null}
      {actionError ? <div style={{ color: "crimson", marginTop: 8 }}>Action error: {actionError}</div> : null}

      {/* Filters */}
      <div
        style={{
          marginTop: 16,
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 12,
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr 1fr",
          gap: 10,
          alignItems: "center",
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search: name, id, segment, owner…"
          style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
        />

        <select value={stage} onChange={(e) => setStage(e.target.value)} style={{ padding: 10 }}>
          <option value="All">Stage: All</option>
          <option value="Prospect">Prospect</option>
          <option value="Engaged">Engaged</option>
          <option value="Qualified">Qualified</option>
          <option value="Negotiation">Negotiation</option>
          <option value="Closed">Closed</option>
        </select>

        <select value={owner} onChange={(e) => setOwner(e.target.value)} style={{ padding: 10 }}>
          {ownerOptions.map((o) => (
            <option key={o} value={o}>
              Owner: {o}
            </option>
          ))}
        </select>

        <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ padding: 10 }}>
          <option value="All">Priority: All</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} />
          Active only
        </label>

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={hideWithoutNextAction}
            onChange={(e) => setHideWithoutNextAction(e.target.checked)}
          />
          Hide without Next Action
        </label>

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="checkbox" checked={dueOnly} onChange={(e) => setDueOnly(e.target.checked)} />
          Due only
        </label>

        <button onClick={clearFilters} style={{ padding: "8px 12px" }}>
          Clear filters
        </button>
      </div>

      {loading ? (
        <div style={{ marginTop: 16 }}>Loading…</div>
      ) : (
        <>
          <h2 style={{ marginTop: 24 }}>Due Now</h2>
          <div style={{ opacity: 0.8, marginTop: -8 }}>These need attention today.</div>

          {dueNow.length === 0 ? (
            <div style={{ marginTop: 12, padding: 14, border: "1px solid #eee", borderRadius: 10 }}>
              Nothing due right now (with current filters).
            </div>
          ) : (
            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              {dueNow.map((l) => (
                <TaskCard key={l.id} l={l} />
              ))}
            </div>
          )}

          <h2 style={{ marginTop: 28 }}>Upcoming</h2>
          <div style={{ opacity: 0.8, marginTop: -8 }}>Scheduled follow-ups.</div>

          {upcoming.length === 0 ? (
            <div style={{ marginTop: 12, padding: 14, border: "1px solid #eee", borderRadius: 10 }}>
              No upcoming tasks (with current filters).
            </div>
          ) : (
            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              {upcoming.map((l) => (
                <TaskCard key={l.id} l={l} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
