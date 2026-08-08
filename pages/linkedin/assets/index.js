// pages/linkedin/assets/index.js
import { useEffect, useState } from "react";
import Layout from "../../../components/Layout";

const EMPTY_FORM = {
  assetName: "",
  assetType: "guide",
  canonicalUrl: "",
  sourceCopy: "",
  shortSummary: "",
  learningOutcomes: "",
  targetAudiences: "",
  primaryProblem: "",
  approvedCta: "",
  gatingType: "none",
};

const inputStyle = { padding: "8px 10px", border: "1px solid #ccc", borderRadius: 6, width: "100%" };
const labelStyle = { fontSize: 13, fontWeight: 600, marginTop: 10, display: "block" };
const ASSET_TYPES = ["report", "guide", "checklist", "scorecard", "course", "briefing", "video", "other"];

function toLines(value) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function AssetsPage() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/linkedin/assets", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load assets");
      setAssets(data);
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
      const res = await fetch("/api/linkedin/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          learningOutcomes: toLines(form.learningOutcomes),
          targetAudiences: toLines(form.targetAudiences),
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

  async function toggleActive(asset) {
    setError("");
    try {
      const res = await fetch(`/api/linkedin/assets/${asset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !asset.active }),
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
      <h1>Educational Asset Catalog</h1>
      <p>Reports, guides, scorecards, and other resources approved for asset-themed posts (spec §7).</p>

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

      <form onSubmit={onCreate} style={{ maxWidth: 560, border: "1px solid #ddd", borderRadius: 10, padding: 16, marginBottom: 24 }}>
        <h3 style={{ marginTop: 0 }}>Add Asset</h3>

        <label style={labelStyle}>Asset name</label>
        <input style={inputStyle} value={form.assetName} onChange={(e) => update("assetName", e.target.value)} required />

        <label style={labelStyle}>Type</label>
        <select style={inputStyle} value={form.assetType} onChange={(e) => update("assetType", e.target.value)}>
          {ASSET_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <label style={labelStyle}>Canonical URL</label>
        <input style={inputStyle} value={form.canonicalUrl} onChange={(e) => update("canonicalUrl", e.target.value)} required placeholder="https://..." />

        <label style={labelStyle}>Source copy (approved description the post is derived from)</label>
        <textarea style={{ ...inputStyle, minHeight: 80 }} value={form.sourceCopy} onChange={(e) => update("sourceCopy", e.target.value)} required />

        <label style={labelStyle}>Short summary</label>
        <textarea style={{ ...inputStyle, minHeight: 50 }} value={form.shortSummary} onChange={(e) => update("shortSummary", e.target.value)} />

        <label style={labelStyle}>Learning outcomes (one per line)</label>
        <textarea style={{ ...inputStyle, minHeight: 50 }} value={form.learningOutcomes} onChange={(e) => update("learningOutcomes", e.target.value)} />

        <label style={labelStyle}>Target audiences (one per line)</label>
        <textarea style={{ ...inputStyle, minHeight: 50 }} value={form.targetAudiences} onChange={(e) => update("targetAudiences", e.target.value)} />

        <label style={labelStyle}>Primary problem it addresses</label>
        <textarea style={{ ...inputStyle, minHeight: 50 }} value={form.primaryProblem} onChange={(e) => update("primaryProblem", e.target.value)} />

        <label style={labelStyle}>Approved CTA</label>
        <input style={inputStyle} value={form.approvedCta} onChange={(e) => update("approvedCta", e.target.value)} placeholder="e.g. Download the report" />

        <label style={labelStyle}>Gating type</label>
        <select style={inputStyle} value={form.gatingType} onChange={(e) => update("gatingType", e.target.value)}>
          <option value="none">Ungated</option>
          <option value="form">Form-gated</option>
          <option value="email">Email-gated</option>
        </select>

        <button type="submit" disabled={saving} style={{ marginTop: 14, padding: "8px 14px" }}>
          {saving ? "Saving…" : "Add asset"}
        </button>
      </form>

      {loading ? (
        <p>Loading…</p>
      ) : assets.length === 0 ? (
        <p>No assets yet.</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {assets.map((a) => (
            <div key={a.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>
                    {a.assetName} <span style={{ fontSize: 12, opacity: 0.7 }}>({a.assetType})</span>{" "}
                    {a.active ? <span style={{ color: "green", fontSize: 12 }}>ACTIVE</span> : <span style={{ color: "#999", fontSize: 12 }}>inactive</span>}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.75 }}>
                    v{a.version} • url: {a.urlStatus} • last used: {a.lastUsedAt ? new Date(a.lastUsedAt).toLocaleDateString() : "never"}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>{a.canonicalUrl}</div>
                </div>
                <button onClick={() => toggleActive(a)} style={{ padding: "4px 10px" }}>
                  {a.active ? "Deactivate" : "Activate"}
                </button>
              </div>
              {a.shortSummary ? <p style={{ marginBottom: 0, marginTop: 6 }}>{a.shortSummary}</p> : null}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
