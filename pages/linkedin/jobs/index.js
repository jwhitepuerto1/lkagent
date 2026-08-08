// pages/linkedin/jobs/index.js
import { useEffect, useState } from "react";
import Link from "next/link";
import Layout from "../../../components/Layout";

const btn = { padding: "6px 10px", marginRight: 6 };
const DEFAULT_STATUSES = "QUEUED,PRECHECK,AWAITING_HUMAN,BLOCKED,PENDING_GROUP_REVIEW";

function JobRow({ job, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [postUrl, setPostUrl] = useState("");

  async function call(url, body) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body || {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Action failed");
      await onChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function promptReason(action) {
    const reason = window.prompt(`Reason to ${action} this job:`);
    if (reason) call(`/api/linkedin/jobs/${job.id}/${action}`, { reason });
  }

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 10, marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <strong>{job.destination?.name}</strong> <span style={{ fontSize: 12, opacity: 0.7 }}>({job.destinationType})</span>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            {job.campaign?.campaignName} • {new Date(job.publishDate).toLocaleDateString()}
          </div>
        </div>
        <div style={{ fontWeight: 700 }}>{job.status}</div>
      </div>

      {job.blockReason ? <p style={{ color: "crimson", fontSize: 12 }}>Blocked: {job.blockReason}</p> : null}
      {error ? <p style={{ color: "crimson", fontSize: 12 }}>{error}</p> : null}

      <details style={{ fontSize: 12, marginTop: 4 }}>
        <summary style={{ cursor: "pointer" }}>Post text</summary>
        <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>{job.contentTextSnapshot}</pre>
      </details>

      <div style={{ marginTop: 8 }}>
        {["QUEUED", "BLOCKED"].includes(job.status) ? (
          <button disabled={busy} style={btn} onClick={() => call(`/api/linkedin/jobs/${job.id}/precheck`)}>
            Run precheck
          </button>
        ) : null}

        {job.status === "AWAITING_HUMAN" ? (
          <>
            <input
              placeholder="Paste the resulting LinkedIn post URL"
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
              style={{ padding: "6px 8px", width: 320, marginRight: 6 }}
            />
            <button disabled={busy || !postUrl} style={btn} onClick={() => call(`/api/linkedin/jobs/${job.id}/confirm-publish`, { postUrl })}>
              Confirm publish
            </button>
          </>
        ) : null}

        {job.status === "PENDING_GROUP_REVIEW" ? (
          <>
            <button disabled={busy} style={btn} onClick={() => call(`/api/linkedin/jobs/${job.id}/mark-reviewed`, { approved: true })}>
              Moderator approved
            </button>
            <button disabled={busy} style={btn} onClick={() => call(`/api/linkedin/jobs/${job.id}/mark-reviewed`, { approved: false })}>
              Moderator rejected
            </button>
          </>
        ) : null}

        {!["PUBLISHED", "CANCELLED", "SKIPPED"].includes(job.status) ? (
          <>
            <button disabled={busy} style={btn} onClick={() => promptReason("skip")}>Skip</button>
            <button disabled={busy} style={btn} onClick={() => promptReason("cancel")}>Cancel</button>
          </>
        ) : null}

        {job.publishedPost ? (
          <a href={job.publishedPost.postUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>
            View published post
          </a>
        ) : null}
      </div>
    </div>
  );
}

export default function JobsQueuePage() {
  const [jobs, setJobs] = useState([]);
  const [statusFilter, setStatusFilter] = useState(DEFAULT_STATUSES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/linkedin/jobs?${params}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed to load jobs");
      setJobs(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  return (
    <Layout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Publishing Queue</h1>
        <div>
          <Link href="/linkedin/jobs/group-session" style={{ marginRight: 12 }}>Group Session</Link>
          <Link href="/linkedin/jobs/exceptions">Exceptions</Link>
        </div>
      </div>
      <p style={{ fontSize: 13, opacity: 0.75 }}>
        Fully supervised — every job requires an explicit precheck and confirm click. Refresh to see newly due jobs.
      </p>

      <div style={{ marginBottom: 12 }}>
        <button style={btn} onClick={load}>Refresh</button>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: "6px 8px" }}>
          <option value={DEFAULT_STATUSES}>Actionable (default)</option>
          <option value="">All statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="PENDING_GROUP_REVIEW">Pending group review</option>
          <option value="BLOCKED,FAILED">Blocked/Failed</option>
        </select>
      </div>

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

      {loading ? (
        <p>Loading…</p>
      ) : jobs.length === 0 ? (
        <p>No jobs match this filter.</p>
      ) : (
        jobs.map((job) => <JobRow key={job.id} job={job} onChanged={load} />)
      )}
    </Layout>
  );
}
