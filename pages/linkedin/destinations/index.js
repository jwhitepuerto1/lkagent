// pages/linkedin/destinations/index.js
import { useEffect, useState } from "react";
import Layout from "../../../components/Layout";

const EMPTY_FORM = {
  destinationType: "GROUP",
  name: "",
  linkedinReference: "",
  audienceDescription: "",
  rulesSummary: "",
  promotionalLinksAllowed: true,
  requiresModeratorReview: false,
  urlPlacementPolicy: "end",
};

const inputStyle = { padding: "8px 10px", border: "1px solid #ccc", borderRadius: 6, width: "100%" };
const labelStyle = { fontSize: 13, fontWeight: 600, marginTop: 10, display: "block" };

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/linkedin/destinations", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load destinations");
      setDestinations(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function onCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/linkedin/destinations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setForm(EMPTY_FORM);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(id, status) {
    setError("");
    try {
      const res = await fetch(`/api/linkedin/destinations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  const grouped = { PERSONAL: [], COMPANY: [], GROUP: [] };
  for (const d of destinations) grouped[d.destinationType]?.push(d);

  return (
    <Layout>
      <h1>LinkedIn Destinations</h1>
      <p>Personal profile, company Page, and Group registry (spec §7.3).</p>

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

      <form onSubmit={onCreate} style={{ maxWidth: 480, border: "1px solid #ddd", borderRadius: 10, padding: 16, marginBottom: 24 }}>
        <h3 style={{ marginTop: 0 }}>Add Destination</h3>

        <label style={labelStyle}>Type</label>
        <select style={inputStyle} value={form.destinationType} onChange={(e) => update("destinationType", e.target.value)}>
          <option value="PERSONAL">Personal profile</option>
          <option value="COMPANY">Company Page</option>
          <option value="GROUP">Group</option>
        </select>

        <label style={labelStyle}>Name</label>
        <input style={inputStyle} value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. John White or CRE Sponsors Network" />

        <label style={labelStyle}>LinkedIn URL / reference</label>
        <input style={inputStyle} value={form.linkedinReference} onChange={(e) => update("linkedinReference", e.target.value)} placeholder="https://www.linkedin.com/..." />

        <label style={labelStyle}>Audience description</label>
        <textarea style={{ ...inputStyle, minHeight: 60 }} value={form.audienceDescription} onChange={(e) => update("audienceDescription", e.target.value)} />

        <label style={labelStyle}>Rules summary</label>
        <textarea style={{ ...inputStyle, minHeight: 60 }} value={form.rulesSummary} onChange={(e) => update("rulesSummary", e.target.value)} />

        <label style={labelStyle}>URL placement policy</label>
        <select style={inputStyle} value={form.urlPlacementPolicy} onChange={(e) => update("urlPlacementPolicy", e.target.value)}>
          <option value="end">Once, at the end</option>
          <option value="top_and_bottom">Top and bottom</option>
        </select>

        <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={form.promotionalLinksAllowed} onChange={(e) => update("promotionalLinksAllowed", e.target.checked)} />
          Promotional links allowed
        </label>

        <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={form.requiresModeratorReview} onChange={(e) => update("requiresModeratorReview", e.target.checked)} />
          Requires moderator review after posting
        </label>

        <button type="submit" disabled={saving} style={{ marginTop: 14, padding: "8px 14px" }}>
          {saving ? "Saving…" : "Add destination"}
        </button>
      </form>

      {loading ? (
        <p>Loading…</p>
      ) : (
        ["PERSONAL", "COMPANY", "GROUP"].map((type) => (
          <div key={type} style={{ marginBottom: 20 }}>
            <h3>{type === "PERSONAL" ? "Personal profile" : type === "COMPANY" ? "Company Page" : "Groups"} ({grouped[type].length})</h3>
            {grouped[type].length === 0 ? (
              <p style={{ opacity: 0.7 }}>None yet.</p>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {grouped[type].map((d) => (
                  <div key={d.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{d.name}</div>
                      <div style={{ fontSize: 12, opacity: 0.75 }}>
                        {d.status} {d.requiresModeratorReview ? "• moderator review" : ""} {d.linkedinReference ? `• ${d.linkedinReference}` : ""}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {d.status !== "ACTIVE" && (
                        <button onClick={() => setStatus(d.id, "ACTIVE")} style={{ padding: "4px 10px" }}>Activate</button>
                      )}
                      {d.status !== "PAUSED" && (
                        <button onClick={() => setStatus(d.id, "PAUSED")} style={{ padding: "4px 10px" }}>Pause</button>
                      )}
                      {d.status !== "BLOCKED" && (
                        <button onClick={() => setStatus(d.id, "BLOCKED")} style={{ padding: "4px 10px" }}>Block</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </Layout>
  );
}
