// pages/linkedin/topics/index.js
import { useEffect, useState } from "react";
import Layout from "../../../components/Layout";

const EMPTY_FORM = {
  name: "",
  description: "",
  approvedAngles: "",
  prohibitedAngles: "",
  targetAudiences: "",
  supportingFacts: "",
  preferredCtaType: "",
};

const inputStyle = { padding: "8px 10px", border: "1px solid #ccc", borderRadius: 6, width: "100%" };
const labelStyle = { fontSize: 13, fontWeight: 600, marginTop: 10, display: "block" };

function toLines(value) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function fromLines(arr) {
  return Array.isArray(arr) ? arr.join("\n") : "";
}

export default function TopicsPage() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/linkedin/topics", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load topics");
      setTopics(data);
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

  const activeCount = topics.filter((t) => t.active).length;

  async function onCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/linkedin/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          approvedAngles: toLines(form.approvedAngles),
          prohibitedAngles: toLines(form.prohibitedAngles),
          targetAudiences: toLines(form.targetAudiences),
          supportingFacts: toLines(form.supportingFacts),
          active: activeCount < 10,
        }),
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

  async function toggleActive(topic) {
    setError("");
    try {
      const res = await fetch(`/api/linkedin/topics/${topic.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !topic.active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <Layout>
      <h1>Insight Topic Catalog</h1>
      <p>
        Exactly {10} active slots (spec §6). Currently <strong>{activeCount}/10</strong> active.
      </p>

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

      <form onSubmit={onCreate} style={{ maxWidth: 560, border: "1px solid #ddd", borderRadius: 10, padding: 16, marginBottom: 24 }}>
        <h3 style={{ marginTop: 0 }}>Add Topic</h3>

        <label style={labelStyle}>Name</label>
        <input style={inputStyle} value={form.name} onChange={(e) => update("name", e.target.value)} required />

        <label style={labelStyle}>Description / core question</label>
        <textarea style={{ ...inputStyle, minHeight: 60 }} value={form.description} onChange={(e) => update("description", e.target.value)} />

        <label style={labelStyle}>Approved angles (one per line)</label>
        <textarea style={{ ...inputStyle, minHeight: 60 }} value={form.approvedAngles} onChange={(e) => update("approvedAngles", e.target.value)} />

        <label style={labelStyle}>Prohibited angles (one per line)</label>
        <textarea style={{ ...inputStyle, minHeight: 50 }} value={form.prohibitedAngles} onChange={(e) => update("prohibitedAngles", e.target.value)} />

        <label style={labelStyle}>Target audiences (one per line)</label>
        <textarea style={{ ...inputStyle, minHeight: 50 }} value={form.targetAudiences} onChange={(e) => update("targetAudiences", e.target.value)} />

        <label style={labelStyle}>Supporting facts / approved doctrine (one per line)</label>
        <textarea style={{ ...inputStyle, minHeight: 60 }} value={form.supportingFacts} onChange={(e) => update("supportingFacts", e.target.value)} />

        <label style={labelStyle}>Preferred CTA type</label>
        <input style={inputStyle} value={form.preferredCtaType} onChange={(e) => update("preferredCtaType", e.target.value)} placeholder="e.g. soft question, resource invite" />

        <button type="submit" disabled={saving} style={{ marginTop: 14, padding: "8px 14px" }}>
          {saving ? "Saving…" : "Add topic"}
        </button>
      </form>

      {loading ? (
        <p>Loading…</p>
      ) : topics.length === 0 ? (
        <p>No topics yet.</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {topics.map((t) => (
            <div key={t.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>
                    {t.name} {t.active ? <span style={{ color: "green", fontSize: 12 }}>ACTIVE</span> : <span style={{ color: "#999", fontSize: 12 }}>inactive</span>}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.75 }}>
                    v{t.version} • last used: {t.lastUsedAt ? new Date(t.lastUsedAt).toLocaleDateString() : "never"}
                  </div>
                </div>
                <button
                  onClick={() => toggleActive(t)}
                  disabled={!t.active && activeCount >= 10}
                  style={{ padding: "4px 10px" }}
                >
                  {t.active ? "Deactivate" : "Activate"}
                </button>
              </div>
              {t.description ? <p style={{ marginBottom: 0, marginTop: 6 }}>{t.description}</p> : null}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
