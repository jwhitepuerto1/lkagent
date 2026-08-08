// pages/linkedin/settings.js
import { useEffect, useState } from "react";
import Layout from "../../components/Layout";

const inputStyle = { padding: "8px 10px", border: "1px solid #ccc", borderRadius: 6, width: 140 };
const row = { display: "flex", alignItems: "center", gap: 10, marginBottom: 10 };

export default function SettingsPage() {
  const [control, setControl] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/linkedin/controls", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed to load settings");
      setControl(data.control);
      setConfig(data.config);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(patch) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/linkedin/controls", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Save failed");
      setControl(data.control);
      setConfig(data.config);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !control || !config) {
    return <Layout>{error ? <p style={{ color: "crimson" }}>{error}</p> : <p>Loading…</p>}</Layout>;
  }

  return (
    <Layout>
      <h1>Publishing Controls &amp; Config</h1>
      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

      <h3>Kill switches</h3>
      <label style={row}>
        <input type="checkbox" checked={control.pauseAll} onChange={(e) => save({ pauseAll: e.target.checked })} disabled={saving} />
        Pause ALL publishing
      </label>
      <label style={row}>
        <input type="checkbox" checked={control.pausePersonal} onChange={(e) => save({ pausePersonal: e.target.checked })} disabled={saving} />
        Pause personal profile publishing
      </label>
      <label style={row}>
        <input type="checkbox" checked={control.pauseCompany} onChange={(e) => save({ pauseCompany: e.target.checked })} disabled={saving} />
        Pause company Page publishing
      </label>
      <label style={row}>
        <input type="checkbox" checked={control.pauseAllGroups} onChange={(e) => save({ pauseAllGroups: e.target.checked })} disabled={saving} />
        Pause ALL group publishing
      </label>

      <h3 style={{ marginTop: 24 }}>Generation config</h3>
      <div style={row}>
        <label>LinkedIn character limit</label>
        <input
          type="number"
          style={inputStyle}
          defaultValue={config.linkedinCharLimit}
          onBlur={(e) => save({ linkedinCharLimit: e.target.value })}
        />
      </div>
      <div style={row}>
        <label>Similarity threshold (0-1)</label>
        <input
          type="number"
          step="0.01"
          style={inputStyle}
          defaultValue={config.similarityThreshold}
          onBlur={(e) => save({ similarityThreshold: e.target.value })}
        />
      </div>
      <div style={row}>
        <label>Duplicate lookback (days)</label>
        <input
          type="number"
          style={inputStyle}
          defaultValue={config.duplicateLookbackDays}
          onBlur={(e) => save({ duplicateLookbackDays: e.target.value })}
        />
      </div>
      <div style={row}>
        <label>Reuse cooldown (days)</label>
        <input
          type="number"
          style={inputStyle}
          defaultValue={config.reuseCooldownDays}
          onBlur={(e) => save({ reuseCooldownDays: e.target.value })}
        />
      </div>
    </Layout>
  );
}
