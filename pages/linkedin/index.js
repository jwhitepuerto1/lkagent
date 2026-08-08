// pages/linkedin/index.js
import Link from "next/link";
import Layout from "../../components/Layout";

const cardStyle = { border: "1px solid #ddd", borderRadius: 10, padding: 16, textDecoration: "none", color: "inherit" };

export default function LinkedInOverviewPage() {
  return (
    <Layout>
      <h1>LinkedIn Post Generation &amp; Publishing</h1>
      <p>Phase 1 — fully supervised. No content publishes without an explicit human confirmation.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginTop: 16 }}>
        <Link href="/linkedin/campaigns" style={cardStyle}>
          <strong>Campaigns</strong>
          <p style={{ fontSize: 13, margin: "6px 0 0" }}>Create and review 5/10-day content campaigns.</p>
        </Link>
        <Link href="/linkedin/destinations" style={cardStyle}>
          <strong>Destinations</strong>
          <p style={{ fontSize: 13, margin: "6px 0 0" }}>Personal profile, company Page, and Group registry.</p>
        </Link>
        <Link href="/linkedin/topics" style={cardStyle}>
          <strong>Topics</strong>
          <p style={{ fontSize: 13, margin: "6px 0 0" }}>The 10-slot insight topic catalog.</p>
        </Link>
        <Link href="/linkedin/assets" style={cardStyle}>
          <strong>Assets</strong>
          <p style={{ fontSize: 13, margin: "6px 0 0" }}>Educational asset catalog.</p>
        </Link>
        <Link href="/linkedin/jobs" style={cardStyle}>
          <strong>Publishing queue</strong>
          <p style={{ fontSize: 13, margin: "6px 0 0" }}>Precheck and confirm jobs for all destinations.</p>
        </Link>
        <Link href="/linkedin/jobs/group-session" style={cardStyle}>
          <strong>Group session</strong>
          <p style={{ fontSize: 13, margin: "6px 0 0" }}>One Group at a time, supervised confirm.</p>
        </Link>
        <Link href="/linkedin/jobs/exceptions" style={cardStyle}>
          <strong>Exceptions</strong>
          <p style={{ fontSize: 13, margin: "6px 0 0" }}>Blocked, failed, and pending-review jobs.</p>
        </Link>
        <Link href="/linkedin/reports" style={cardStyle}>
          <strong>Reports</strong>
          <p style={{ fontSize: 13, margin: "6px 0 0" }}>Scheduled vs. published, by campaign and destination.</p>
        </Link>
        <Link href="/linkedin/settings" style={cardStyle}>
          <strong>Settings</strong>
          <p style={{ fontSize: 13, margin: "6px 0 0" }}>Pause switches and generation config.</p>
        </Link>
      </div>
    </Layout>
  );
}
