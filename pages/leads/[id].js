// pages/leads/[id].js
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

function toDateInputValue(v) {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function fmtDateTime(v) {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

export default function LeadDetailPage() {
  const router = useRouter();
  const leadId = router.query.id ? String(router.query.id) : "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");

  const [lead, setLead] = useState(null);

  const [activities, setActivities] = useState([]);
  const [actLoading, setActLoading] = useState(true);
  const [actError, setActError] = useState("");

  const [newType, setNewType] = useState("Call");
  const [newNote, setNewNote] = useState("");
  const [newOccurredAt, setNewOccurredAt] = useState(""); // datetime-local optional

  async function loadLead() {
    if (!leadId) return;
    setLoading(true);
    setApiError("");

    try {
      const res = await fetch(`/api/leads/${encodeURIComponent(leadId)}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data?.error || data?.message || `Failed (${res.status})`);
      setLead(data);
    } catch (e) {
      setApiError(e?.message || "Failed to load lead");
      setLead(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadActivities() {
    if (!leadId) return;
    setActLoading(true);
    setActError("");

    try {
      const res = await fetch(`/api/activities?leadId=${encodeURIComponent(leadId)}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ([]));

      if (!res.ok) throw new Error(data?.error || data?.message || `Failed (${res.status})`);
      setActivities(Array.isArray(data) ? data : []);
    } catch (e) {
      setActError(e?.message || "Failed to load activities");
      setActivities([]);
    } finally {
      setActLoading(false);
    }
  }

  useEffect(() => {
    loadLead();
    loadActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  const nextActionInput = useMemo(() => toDateInputValue(lead?.nextActionAt), [lead?.nextActionAt]);
  const lastTouchInput = useMemo(() => toDateInputValue(lead?.lastTouch), [lead?.lastTouch]);

  function updateLeadField(key, value) {
    setLead((p) => ({ ...(p || {}), [key]: value }));
  }

  async function saveLead() {
    if (!leadId || !lead) return;
    setSaving(true);
    setApiError("");

    try {
      const payload = {
        name: lead.name,
        segment: lead.segment,
        stage: lead.stage,
        status: lead.status,
        owner: lead.owner,
        priority: lead.priority,
        nextActionAt: lead.nextActionAt ? new Date(lead.nextActionAt).toISOString() : null,
        lastTouch: lead.lastTouch ? new Date(lead.lastTouch).toISOString() : null,
      };

      const res = await fetch(`/api/leads/${encodeURIComponent(leadId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || `Save failed (${res.status})`);

      setLead(data);
    } catch (e) {
      setApiError(e?.message || "Failed to save lead");
    } finally {
      setSaving(false);
    }
  }

  async function addActivity(e) {
    e.preventDefault();
    setActError("");

    try {
      const occurredAt =
        newOccurredAt && newOccurredAt.trim()
          ? new Date(newOccurredAt).toISOString()
          : new Date().toISOString();

      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          type: newType,
          note: newNote?.trim() ? newNote.trim() : null,
          occurredAt,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || `Create failed (${res.status})`);

      setNewNote("");
      setNewOccurredAt("");
      await loadActivities();
    } catch (e2) {
      setActError(e2?.message || "Failed to add activity");
    }
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Loading…</div>;
  }

  if (!lead) {
    return (
      <div style={{ padding: 24 }}>
        <Link href="/leads">← Back to Leads</Link>
        <h1 style={{ marginTop: 12 }}>Lead</h1>
        <div style={{ color: "crimson" }}>{apiError || "Lead not found"}</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <Link href="/leads">← Back to Leads</Link>
          <h1 style={{ margin: "10px 0 0" }}>
            {lead.name} <span style={{ opacity: 0.6, fontSize: 16 }}>({lead.id})</span>
          </h1>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={saveLead} disabled={saving} style={{ padding: "8px 12px" }}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {apiError ? <div style={{ color: "crimson", marginTop: 8 }}>API error: {apiError}</div> : null}

      {/* Lead Edit Form */}
      <div
        style={{
          marginTop: 16,
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 14,
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 12,
        }}
      >
        <label>
          Name
          <input
            value={lead.name || ""}
            onChange={(e) => updateLeadField("name", e.target.value)}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
          />
        </label>

        <label>
          Owner
          <input
            value={lead.owner || ""}
            onChange={(e) => updateLeadField("owner", e.target.value)}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
          />
        </label>

        <label>
          Segment
          <input
            value={lead.segment || ""}
            onChange={(e) => updateLeadField("segment", e.target.value)}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
          />
        </label>

        <label>
          Stage
          <select
            value={lead.stage || "Prospect"}
            onChange={(e) => updateLeadField("stage", e.target.value)}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
          >
            <option value="Prospect">Prospect</option>
            <option value="Engaged">Engaged</option>
            <option value="Qualified">Qualified</option>
            <option value="Negotiation">Negotiation</option>
            <option value="Closed">Closed</option>
          </select>
        </label>

        <label>
          Status
          <select
            value={lead.status || "Active"}
            onChange={(e) => updateLeadField("status", e.target.value)}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="New">New</option>
          </select>
        </label>

        <label>
          Priority
          <select
            value={lead.priority || "Medium"}
            onChange={(e) => updateLeadField("priority", e.target.value)}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </label>

        <label>
          Next Action Date
          <input
            type="date"
            value={nextActionInput}
            onChange={(e) =>
              updateLeadField(
                "nextActionAt",
                e.target.value ? new Date(e.target.value).toISOString() : null
              )
            }
            style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
          />
        </label>

        <label>
          Last Touch Date
          <input
            type="date"
            value={lastTouchInput}
            onChange={(e) =>
              updateLeadField("lastTouch", e.target.value ? new Date(e.target.value).toISOString() : null)
            }
            style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
          />
        </label>
      </div>

      {/* Activities */}
      <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 14 }}>
          <h2 style={{ marginTop: 0 }}>Log Activity</h2>
          {actError ? <div style={{ color: "crimson", marginBottom: 8 }}>{actError}</div> : null}

          <form onSubmit={addActivity} style={{ display: "grid", gap: 10 }}>
            <label>
              Type
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
              >
                <option value="Call">Call</option>
                <option value="Email">Email</option>
                <option value="Meeting">Meeting</option>
                <option value="Note">Note</option>
                <option value="Task">Task</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label>
              Occurred At (optional)
              <input
                type="datetime-local"
                value={newOccurredAt}
                onChange={(e) => setNewOccurredAt(e.target.value)}
                style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
              />
            </label>

            <label>
              Note (optional)
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={4}
                style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
              />
            </label>

            <button type="submit" style={{ padding: "10px 14px" }}>
              Add Activity
            </button>
          </form>
        </div>

        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <h2 style={{ marginTop: 0 }}>Timeline</h2>
            <button onClick={loadActivities} style={{ padding: "8px 12px" }}>
              Refresh
            </button>
          </div>

          {actLoading ? (
            <div>Loading…</div>
          ) : activities.length === 0 ? (
            <div>No activities yet.</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {activities.map((a) => (
                <div key={a.id} style={{ border: "1px solid #eee", borderRadius: 10, padding: 10 }}>
                  <div style={{ fontWeight: 700 }}>
                    {a.type}{" "}
                    <span style={{ opacity: 0.7, fontWeight: 400 }}>• {fmtDateTime(a.occurredAt)}</span>
                  </div>
                  {a.note ? <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{a.note}</div> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
