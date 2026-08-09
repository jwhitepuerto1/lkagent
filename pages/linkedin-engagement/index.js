// pages/linkedin-engagement/index.js
import { useEffect, useState } from "react";
import Layout from "../../components/Layout";

const btn = { padding: "8px 14px", marginRight: 8 };

function EngagerRow({ engagement }) {
  const profile = engagement.profile;
  const label = profile.fullName || profile.publicUrl || profile.linkedinUrn;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #eee" }}>
      <div>
        <strong>{label}</strong>{" "}
        <span style={{ fontSize: 12, opacity: 0.7 }}>
          {engagement.type === "COMMENT" ? "commented" : "liked"}
        </span>
        {engagement.commentText ? <div style={{ fontSize: 13, marginTop: 2 }}>&ldquo;{engagement.commentText}&rdquo;</div> : null}
      </div>
      <div style={{ fontSize: 12, opacity: 0.6, whiteSpace: "nowrap" }}>
        {new Date(engagement.reactedAt).toLocaleString()}
      </div>
    </div>
  );
}

function PostCard({ post, onLoadDetail }) {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!expanded && !detail) {
      setLoading(true);
      const data = await onLoadDetail(post.id);
      setDetail(data);
      setLoading(false);
    }
    setExpanded((e) => !e);
  }

  const name = post.textSnippet || post.url;

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }} onClick={toggle}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 500 }}>
            {name}
          </div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            {post.source} {!post.sourceConfident ? "(unconfirmed)" : ""} • {new Date(post.postedAt).toLocaleDateString()} •{" "}
            <a href={post.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>view on LinkedIn</a>
          </div>
        </div>
        <div style={{ fontSize: 13, whiteSpace: "nowrap" }}>
          {post.likeCount} likes • {post.commentCount} comments
        </div>
      </div>

      {expanded ? (
        <div style={{ marginTop: 10 }}>
          {loading ? (
            <p>Loading…</p>
          ) : detail?.engagements?.length ? (
            detail.engagements.map((e) => <EngagerRow key={e.id} engagement={e} />)
          ) : (
            <p style={{ opacity: 0.7 }}>No engagement recorded yet.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function LinkedInEngagementPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/linkedin-engagement/posts", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed to load posts");
      setPosts(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function loadDetail(postId) {
    const res = await fetch(`/api/linkedin-engagement/posts?postId=${postId}`, { cache: "no-store" });
    return res.json();
  }

  async function runNow() {
    setRunning(true);
    setError("");
    setRunResult(null);
    try {
      const res = await fetch("/api/linkedin-engagement/run", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Run failed");
      setRunResult(data);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <Layout>
      <h1>LinkedIn Engagement</h1>
      <p style={{ fontSize: 13, opacity: 0.75 }}>
        Who liked and commented on each post, pulled daily via Unipile. Needs UNIPILE_API_KEY/DSN/ACCOUNT_ID
        configured before "Run now" will find real data.
      </p>

      <button style={btn} disabled={running} onClick={runNow}>
        {running ? "Running…" : "Run ingestion now"}
      </button>
      <button style={btn} onClick={load}>Refresh</button>

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
      {runResult ? (
        <p style={{ fontSize: 12, opacity: 0.7 }}>
          Scanned {runResult.postsScanned} posts, found {runResult.newEngagements} new engagements.
          {runResult.warnings?.length ? ` ${runResult.warnings.length} warning(s) - see EngagementSyncRun log.` : ""}
        </p>
      ) : null}

      {loading ? (
        <p>Loading…</p>
      ) : posts.length === 0 ? (
        <p>No posts tracked yet. Run ingestion once Unipile credentials are configured.</p>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} onLoadDetail={loadDetail} />)
      )}
    </Layout>
  );
}
