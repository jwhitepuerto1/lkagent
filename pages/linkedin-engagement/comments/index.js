// pages/linkedin-engagement/comments/index.js
// Manual log of posts John commented on (spec: no discovery endpoint exists
// for this - see docs/linkedin-engagement/README.md).
import { useEffect, useState } from "react";
import Layout from "../../../components/Layout";

const inputStyle = { padding: "8px 10px", border: "1px solid #ccc", borderRadius: 6, width: "100%" };
const btn = { padding: "8px 14px", marginRight: 8 };

export default function OutreachCommentsPage() {
  const [comments, setComments] = useState([]);
  const [postUrl, setPostUrl] = useState("");
  const [myCommentText, setMyCommentText] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [checkingId, setCheckingId] = useState(null);

  async function load() {
    setError("");
    try {
      const res = await fetch("/api/linkedin-engagement/comments", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed to load");
      setComments(data);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onLog(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/linkedin-engagement/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postUrl, myCommentText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed to save");
      setPostUrl("");
      setMyCommentText("");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function checkReplies(id) {
    setCheckingId(id);
    setError("");
    try {
      const res = await fetch(`/api/linkedin-engagement/comments/${id}/check`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Check failed");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setCheckingId(null);
    }
  }

  return (
    <Layout>
      <h1>Comment-Reply Tracking</h1>
      <p style={{ fontSize: 13, opacity: 0.75 }}>
        Log a post you commented on and the exact text of your comment. This agent finds your comment on the
        post (matching your LinkedIn account, not the text) and watches for any comment from someone else that
        appears afterward.
      </p>

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

      <form onSubmit={onLog} style={{ maxWidth: 560, border: "1px solid #ddd", borderRadius: 10, padding: 16, marginBottom: 24 }}>
        <label style={{ fontSize: 13, fontWeight: 600 }}>Post URL</label>
        <input style={inputStyle} value={postUrl} onChange={(e) => setPostUrl(e.target.value)} placeholder="https://www.linkedin.com/..." required />
        <label style={{ fontSize: 13, fontWeight: 600, marginTop: 10, display: "block" }}>Your comment text</label>
        <textarea style={{ ...inputStyle, minHeight: 70 }} value={myCommentText} onChange={(e) => setMyCommentText(e.target.value)} required />
        <button type="submit" disabled={saving} style={{ ...btn, marginTop: 12 }}>
          {saving ? "Saving…" : "Log comment"}
        </button>
      </form>

      {comments.length === 0 ? (
        <p>No comments logged yet.</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {comments.map((c) => (
            <div key={c.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>{c.postUrl}</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>&ldquo;{c.myCommentText}&rdquo;</div>
                </div>
                <div style={{ fontWeight: 700, whiteSpace: "nowrap" }}>{c.status}</div>
              </div>
              <button style={{ ...btn, marginTop: 8 }} disabled={checkingId === c.id} onClick={() => checkReplies(c.id)}>
                {checkingId === c.id ? "Checking…" : "Check for replies"}
              </button>
              {c.replies?.length > 0 ? (
                <div style={{ marginTop: 10, borderTop: "1px solid #eee", paddingTop: 8 }}>
                  {c.replies.map((r) => (
                    <div key={r.id} style={{ fontSize: 13, marginBottom: 6 }}>
                      <strong>{r.replierName || "(unknown)"}</strong>: &ldquo;{r.replyText}&rdquo;
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
