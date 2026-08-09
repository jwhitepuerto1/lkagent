// pages/linkedin-engagement/queues.js
// Daily command center (spec 11.1) - trimmed to what this agent tracks.
import { useEffect, useState } from "react";
import Link from "next/link";
import Layout from "../../components/Layout";

const btn = { padding: "5px 10px", marginRight: 6, fontSize: 12 };

function ScoreBadge({ profile }) {
  if (profile.priorityScore == null) return <span style={{ fontSize: 11, opacity: 0.5 }}>not scored</span>;
  return (
    <span style={{ fontSize: 11, opacity: 0.75 }}>
      priority {profile.priorityScore} • fit {profile.fitScore} • engagement {profile.engagementScore}
      {profile.primaryCategory ? ` • ${profile.primaryCategory}` : ""}
    </span>
  );
}

function PersonActions({ profile, onChanged }) {
  const [busy, setBusy] = useState(false);

  async function patch(data) {
    setBusy(true);
    try {
      await fetch(`/api/linkedin-engagement/profiles/${profile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      await onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: 4 }}>
      <button style={btn} disabled={busy} onClick={() => patch({ status: "WATCHLIST" })}>Watchlist</button>
      <button style={btn} disabled={busy} onClick={() => patch({ status: "IRRELEVANT" })}>Irrelevant</button>
      <button
        style={btn}
        disabled={busy}
        onClick={() => {
          const reason = window.prompt("Suppress - reason?");
          if (reason) patch({ suppressed: true, suppressedReason: reason, status: "SUPPRESSED" });
        }}
      >
        Suppress
      </button>
    </div>
  );
}

function Section({ title, items, empty, renderItem }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h3>{title} ({items.length})</h3>
      {items.length === 0 ? (
        <p style={{ opacity: 0.6, fontSize: 13 }}>{empty}</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>{items.map(renderItem)}</div>
      )}
    </div>
  );
}

const card = { border: "1px solid #ddd", borderRadius: 8, padding: 10 };
const nameLine = { fontWeight: 700 };
const meta = { fontSize: 12, opacity: 0.7 };

export default function QueuesPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const res = await fetch("/api/linkedin-engagement/queues", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || json.error || "Failed to load queues");
      setData(json);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (error) return <Layout><p style={{ color: "crimson" }}>{error}</p></Layout>;
  if (!data) return <Layout><p>Loading…</p></Layout>;

  return (
    <Layout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Daily Command Center</h1>
        <div>
          <Link href="/linkedin-engagement" style={{ marginRight: 12 }}>Posts</Link>
          <Link href="/linkedin-engagement/comments" style={{ marginRight: 12 }}>Comment tracking</Link>
          <Link href="/linkedin-engagement/promote">Promote / Export</Link>
        </div>
      </div>
      <button onClick={load} style={{ ...btn, padding: "6px 12px", marginTop: 8 }}>Refresh</button>

      <Section
        title="Replies requiring attention"
        items={data.repliesRequiringAttention}
        empty="No unanswered DM replies."
        renderItem={(c) => (
          <div key={c.id} style={card}>
            <div style={nameLine}>{c.profile.fullName || c.profile.linkedinUrn}</div>
            <div style={meta}>{c.profile.headline}</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>&ldquo;{c.lastMessageSnippet}&rdquo;</div>
            <div style={{ marginTop: 4 }}><ScoreBadge profile={c.profile} /></div>
            <PersonActions profile={c.profile} onChanged={load} />
          </div>
        )}
      />

      <Section
        title="Comment-reply threads awaiting review"
        items={data.commentRepliesAwaiting}
        empty="No new replies to comments you've logged."
        renderItem={(r) => (
          <div key={r.id} style={card}>
            <div style={nameLine}>{r.replierName || "(unknown)"}</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>&ldquo;{r.replyText}&rdquo;</div>
            <div style={meta}>on: {r.outreachComment.postUrl}</div>
          </div>
        )}
      />

      <Section
        title="New comments on your posts"
        items={data.newComments}
        empty="No new comments in the last 3 days."
        renderItem={(e) => (
          <div key={e.id} style={card}>
            <div style={nameLine}>{e.profile.fullName || e.profile.linkedinUrn}</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>&ldquo;{e.commentText}&rdquo;</div>
            <div style={meta}>on: {e.post.textSnippet?.slice(0, 80)}</div>
            <PersonActions profile={e.profile} onChanged={load} />
          </div>
        )}
      />

      <Section
        title="New reactions"
        items={data.newReactions}
        empty="No new reactions in the last 3 days."
        renderItem={(e) => (
          <div key={e.id} style={card}>
            <div style={nameLine}>{e.profile.fullName || e.profile.linkedinUrn}</div>
            <div style={meta}>{e.type} on: {e.post.textSnippet?.slice(0, 80)}</div>
          </div>
        )}
      />

      <Section
        title="Newly accepted invitations"
        items={data.newlyAcceptedInvitations}
        empty="No newly accepted invitations."
        renderItem={(i) => (
          <div key={i.id} style={card}>
            <div style={nameLine}>{i.profile.fullName || i.profile.linkedinUrn}</div>
            <div style={meta}>{i.profile.headline}</div>
            <PersonActions profile={i.profile} onChanged={load} />
          </div>
        )}
      />

      <Section
        title="Follow-ups due"
        items={data.followUpsDue}
        empty="Nothing due."
        renderItem={(p) => (
          <div key={p.id} style={card}>
            <div style={nameLine}>{p.fullName || p.linkedinUrn}</div>
            <div style={meta}>{p.nextActionReason}</div>
          </div>
        )}
      />

      <h2 style={{ marginTop: 32 }}>Today's 20/20/20 candidates</h2>
      <p style={{ fontSize: 12, opacity: 0.7 }}>
        "Posts worth commenting on" isn't included - no Unipile endpoint discovers other people's posts, so this
        queue would have to be fabricated rather than derived from real data.
      </p>

      <Section
        title="Invitation candidates"
        items={data.invitationCandidates}
        empty="No qualified invitation candidates right now."
        renderItem={(p) => (
          <div key={p.id} style={card}>
            <div style={nameLine}>{p.fullName || p.linkedinUrn}</div>
            <div style={meta}>{p.headline}</div>
            <ScoreBadge profile={p} />
          </div>
        )}
      />

      <Section
        title="DM / follow-up candidates"
        items={data.dmCandidates}
        empty="No first-degree connections awaiting a first message."
        renderItem={(p) => (
          <div key={p.id} style={card}>
            <div style={nameLine}>{p.fullName || p.linkedinUrn}</div>
            <div style={meta}>{p.headline}</div>
            <ScoreBadge profile={p} />
          </div>
        )}
      />
    </Layout>
  );
}
