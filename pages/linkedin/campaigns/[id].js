// pages/linkedin/campaigns/[id].js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../../../components/Layout";

const btn = { padding: "8px 12px", marginRight: 8, marginBottom: 8 };

function StatusBadge({ children, tone = "default" }) {
  const colors = {
    default: "#666",
    good: "green",
    bad: "crimson",
    warn: "#b8860b",
  };
  return <span style={{ fontSize: 12, fontWeight: 700, color: colors[tone] || colors.default }}>{children}</span>;
}

function validationTone(status) {
  if (status === "PASSED") return "good";
  if (status === "FAILED") return "bad";
  return "warn";
}

function approvalTone(status) {
  if (status === "APPROVED" || status === "LOCKED") return "good";
  if (status === "CHANGES_REQUESTED") return "bad";
  return "warn";
}

function PostRow({ post, onChanged }) {
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState(post.postText);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setText(post.postText), [post.postText]);

  async function call(url, options) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(url, options);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Request failed");
      await onChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 10, marginTop: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }} onClick={() => setExpanded((e) => !e)}>
        <div>
          <strong>{post.destination?.name}</strong> <span style={{ fontSize: 12, opacity: 0.7 }}>({post.destination?.destinationType})</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <StatusBadge tone={validationTone(post.validationStatus)}>{post.validationStatus}</StatusBadge>
          <StatusBadge tone={approvalTone(post.approvalStatus)}>{post.approvalStatus}</StatusBadge>
        </div>
      </div>

      {expanded ? (
        <div style={{ marginTop: 10 }}>
          {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
          <textarea
            style={{ width: "100%", minHeight: 140, padding: 8, fontFamily: "inherit" }}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={post.approvalStatus === "LOCKED"}
          />
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
            v{post.copyVersion} • {text.length} chars {post.urlIncluded ? `• url: ${post.urlIncluded}` : ""}
          </div>

          {post.validationResults?.length ? (
            <details style={{ marginTop: 6 }}>
              <summary style={{ cursor: "pointer", fontSize: 12 }}>Validation checks ({post.validationResults.length})</summary>
              <ul style={{ fontSize: 12 }}>
                {post.validationResults.map((v) => (
                  <li key={v.id} style={{ color: v.passed ? "green" : "crimson" }}>
                    {v.checkCode}: {v.passed ? "pass" : `fail (${v.reasonCode || ""}) ${v.message || ""}`}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}

          <div style={{ marginTop: 8 }}>
            <button
              disabled={busy || text === post.postText || post.approvalStatus === "LOCKED"}
              style={btn}
              onClick={() =>
                call(`/api/linkedin/posts/${post.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ postText: text }),
                })
              }
            >
              Save edit
            </button>
            <button
              disabled={busy || post.approvalStatus === "LOCKED"}
              style={btn}
              onClick={() => call(`/api/linkedin/posts/${post.id}/regenerate`, { method: "POST" })}
            >
              Regenerate
            </button>
            <button
              disabled={busy || post.validationStatus !== "PASSED" || post.approvalStatus === "LOCKED"}
              style={btn}
              onClick={() => call(`/api/linkedin/posts/${post.id}/approve`, { method: "POST" })}
            >
              Approve placement
            </button>
            <button
              disabled={busy || post.approvalStatus === "LOCKED"}
              style={btn}
              onClick={() => call(`/api/linkedin/posts/${post.id}/request-changes`, { method: "POST" })}
            >
              Request changes
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ThemeCard({ theme, onChanged }) {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function approveTheme() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/linkedin/themes/${theme.id}/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed");
      await onChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const source = theme.postType === "INSIGHT" ? theme.topic?.name : theme.asset?.assetName;

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }} onClick={() => setExpanded((e) => !e)}>
        <div>
          <strong>Day {theme.dayIndex}</strong> — {theme.postType} — {source || "(no source)"}
          <div style={{ fontSize: 12, opacity: 0.7 }}>{new Date(theme.postDate).toLocaleDateString()} • {theme.generatedPosts?.length ?? 0} variants</div>
        </div>
        <StatusBadge tone={theme.status === "VALIDATION_FAILED" ? "bad" : theme.status === "READY_TO_PUBLISH" ? "good" : "default"}>
          {theme.status}
        </StatusBadge>
      </div>

      {expanded ? (
        <div style={{ marginTop: 10 }}>
          {theme.centralPoint ? <p style={{ fontSize: 13 }}><em>{theme.centralPoint}</em></p> : null}
          {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
          <button disabled={busy} style={btn} onClick={approveTheme}>Approve all placements in this theme</button>
          {(theme.generatedPosts || []).map((post) => (
            <PostRow key={post.id} post={post} onChanged={onChanged} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function CampaignDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  async function load() {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/linkedin/campaigns/${id}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed to load campaign");
      setCampaign(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function runAction(path, method = "POST") {
    setActionBusy(true);
    setActionMessage("");
    setError("");
    try {
      const res = await fetch(`/api/linkedin/campaigns/${id}${path}`, { method });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Action failed");
      setActionMessage(typeof data === "object" ? JSON.stringify(data).slice(0, 300) : "Done");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setActionBusy(false);
    }
  }

  if (loading || !campaign) {
    return (
      <Layout>
        {error ? <p style={{ color: "crimson" }}>{error}</p> : <p>Loading…</p>}
      </Layout>
    );
  }

  const totalPosts = (campaign.themes || []).reduce((sum, t) => sum + (t.generatedPosts?.length ?? 0), 0);
  const hasThemes = (campaign.themes || []).length > 0;

  return (
    <Layout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>{campaign.campaignName}</h1>
          <div style={{ fontSize: 13, opacity: 0.75 }}>
            {campaign.campaignDays} days • {campaign.insightPostCount} insight + {campaign.assetPostCount} asset •{" "}
            {campaign.groupDestinations?.length ?? 0} groups • {totalPosts} generated posts
          </div>
        </div>
        <StatusBadge tone={campaign.status === "READY_TO_PUBLISH" ? "good" : campaign.status === "VALIDATION_FAILED" ? "bad" : "default"}>
          {campaign.status}
        </StatusBadge>
      </div>

      {error ? <p style={{ color: "crimson", marginTop: 10 }}>{error}</p> : null}
      {actionMessage ? <p style={{ fontSize: 12, opacity: 0.7 }}>{actionMessage}</p> : null}

      <div style={{ margin: "16px 0", borderTop: "1px solid #eee", borderBottom: "1px solid #eee", padding: "12px 0" }}>
        <button disabled={actionBusy || hasThemes} style={btn} onClick={() => runAction("/generate-outline")}>
          1. Generate Outline
        </button>
        <button disabled={actionBusy || !hasThemes} style={btn} onClick={() => runAction("/generate-copy")}>
          2. Generate Copy
        </button>
        <button disabled={actionBusy || !hasThemes} style={btn} onClick={() => runAction("/validate")}>
          3. Validate
        </button>
        <button disabled={actionBusy || campaign.status !== "DRAFT"} style={btn} onClick={() => runAction("/submit-for-review")}>
          4. Submit for Review
        </button>
        <button disabled={actionBusy || campaign.status !== "IN_REVIEW"} style={btn} onClick={() => runAction("/approve")}>
          5. Approve All
        </button>
        <button disabled={actionBusy || campaign.status !== "APPROVED"} style={btn} onClick={() => runAction("/lock")}>
          6. Lock &amp; Create Publishing Jobs
        </button>
      </div>

      <h2>Campaign calendar</h2>
      {(campaign.themes || []).map((theme) => (
        <ThemeCard key={theme.id} theme={theme} onChanged={load} />
      ))}
    </Layout>
  );
}
