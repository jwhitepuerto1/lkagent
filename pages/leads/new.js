// pages/leads/new.js
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

function makeLeadId() {
  // Example: L-7F3A91C2
  const hex = Math.random().toString(16).slice(2, 10).toUpperCase();
  return `L-${hex.padEnd(8, "0")}`;
}

export default function NewLeadPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [segment, setSegment] = useState("Developer");
  const [stage, setStage] = useState("Prospect");
  const [status, setStatus] = useState("Active");
  const [owner, setOwner] = useState("John");
  const [priority, setPriority] = useState("Medium");
  const [nextActionAt, setNextActionAt] = useState(""); // yyyy-mm-dd
  const [lastTouch, setLastTouch] = useState(""); // yyyy-mm-dd

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    const id = makeLeadId();

    const payload = {
      id,
      name: name.trim(),
      segment,
      stage,
      status,
      owner,
      priority,
      nextActionAt: nextActionAt ? new Date(nextActionAt).toISOString() : null,
      lastTouch: lastTouch ? new Date(lastTouch).toISOString() : null,
    };

    setSubmitting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let msg = `Create failed (${res.status})`;
        try {
          const body = await res.json();
          msg = body?.message || body?.error || msg;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }

      const created = await res.json();
      const createdId = created?.id || id;

      // Redirect to the detail page so you immediately SEE it exists
      router.push(`/leads/${createdId}`);
    } catch (err) {
      setError(err?.message || "Failed to create lead.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h1 style={{ margin: 0 }}>New Lead</h1>
        <Link href="/leads">← Back to Leads</Link>
      </div>

      {error ? (
        <p style={{ color: "crimson", marginTop: 8 }}>
          {error}
        </p>
      ) : null}

      <form onSubmit={onSubmit} style={{ marginTop: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label>
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
              placeholder="e.g., Playa Developer Group"
            />
          </label>

          <label>
            Owner
            <input
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
            />
          </label>

          <label>
            Segment
            <select
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
              style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
            >
              <option value="Developer">Developer</option>
              <option value="Family Office">Family Office</option>
              <option value="RIA">RIA</option>
              <option value="Broker/Dealer">Broker/Dealer</option>
              <option value="Institutional">Institutional</option>
              <option value="Other">Other</option>
            </select>
          </label>

          <label>
            Priority
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </label>

          <label>
            Stage
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
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
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
            >
              <option value="Active">Active</option>
              <option value="New">New</option>
              <option value="Inactive">Inactive</option>
            </select>
          </label>

          <label>
            Next Action Date
            <input
              type="date"
              value={nextActionAt}
              onChange={(e) => setNextActionAt(e.target.value)}
              style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
            />
          </label>

          <label>
            Last Touch Date
            <input
              type="date"
              value={lastTouch}
              onChange={(e) => setLastTouch(e.target.value)}
              style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
            />
          </label>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button type="submit" disabled={submitting} style={{ padding: "10px 14px" }}>
            {submitting ? "Creating..." : "Create Lead"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/leads")}
            style={{ padding: "10px 14px" }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
