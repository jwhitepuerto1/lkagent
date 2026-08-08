// pages/linkedin/jobs/exceptions.js
// Blocked/failed/pending-review jobs — doubles as the Phase-1 notification
// surface (no email/Slack integration in scope).
import { useEffect, useState } from "react";
import Layout from "../../../components/Layout";

export default function ExceptionsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/linkedin/jobs?status=BLOCKED,FAILED,PENDING_GROUP_REVIEW", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed to load exceptions");
      setJobs(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <Layout>
      <h1>Exceptions</h1>
      <p style={{ fontSize: 13, opacity: 0.75 }}>Blocked, failed, and jobs awaiting Group moderator review.</p>

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

      {loading ? (
        <p>Loading…</p>
      ) : jobs.length === 0 ? (
        <p>No exceptions right now.</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {jobs.map((job) => (
            <div key={job.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <strong>{job.destination?.name}</strong> ({job.destinationType}) — {job.campaign?.campaignName}
                </div>
                <span style={{ color: job.status === "BLOCKED" || job.status === "FAILED" ? "crimson" : "#b8860b", fontWeight: 700 }}>
                  {job.status}
                </span>
              </div>
              {job.blockReason ? <p style={{ fontSize: 12, marginBottom: 0 }}>{job.blockReason}</p> : null}
              <div style={{ fontSize: 12, opacity: 0.7 }}>scheduled {new Date(job.publishDate).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
