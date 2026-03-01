import { useState } from "react";
import { useRouter } from "next/router";

export default function LeadForm({ initialData = {}, mode }) {
  const router = useRouter();

  const [form, setForm] = useState({
    name: initialData.name || "",
    segment: initialData.segment || "",
    source: initialData.source || "",
    owner: initialData.owner || "John",
    priority: initialData.priority || "Medium",
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(
        mode === "edit" ? `/api/leads/${initialData.id}` : "/api/leads",
        {
          method: mode === "edit" ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");

      router.push("/leads");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 600 }}>
      <h2>{mode === "edit" ? "Edit Lead" : "New Lead"}</h2>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <label>Name</label>
      <input value={form.name} onChange={(e) => update("name", e.target.value)} />

      <label>Segment</label>
      <input value={form.segment} onChange={(e) => update("segment", e.target.value)} />

      <label>Source</label>
      <input value={form.source} onChange={(e) => update("source", e.target.value)} />

      <label>Owner</label>
      <input value={form.owner} onChange={(e) => update("owner", e.target.value)} />

      <label>Priority</label>
      <select value={form.priority} onChange={(e) => update("priority", e.target.value)}>
        <option>High</option>
        <option>Medium</option>
        <option>Low</option>
      </select>

      <br /><br />

      <button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
