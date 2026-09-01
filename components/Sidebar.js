import Link from "next/link";

// Link has no color of its own, so it falls back to the browser's default
// anchor colors (blue/purple) instead of inheriting the aside's white text -
// unreadable against the dark background without this.
const navLink = { color: "#fff" };

export default function Sidebar() {
  return (
    <aside
      style={{
        width: "240px",
        background: "#111827",
        color: "#fff",
        padding: "1rem",
      }}
    >
      <h2>IAS</h2>
      <p style={{ fontSize: "14px", opacity: 0.7 }}>
        Command Panel
      </p>

      <nav
        style={{
          marginTop: "2rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        <Link href="/dashboard" style={navLink}>Dashboard</Link>
        <Link href="/leads" style={navLink}>Leads</Link>
        <Link href="/tasks" style={navLink}>Tasks</Link>
        <Link href="/campaigns" style={navLink}>Campaigns</Link>
        <Link href="/analytics" style={navLink}>Analytics</Link>
        <Link href="/linkedin" style={navLink}>LinkedIn Agent</Link>
        <Link href="/linkedin-engagement" style={navLink}>LinkedIn Engagement</Link>
        <Link href="/linkedin-engagement/queues" style={navLink}>Daily Queues</Link>
        <Link href="/linkedin-engagement/comments" style={navLink}>Comment Tracking</Link>
        <Link href="/linkedin-engagement/promote" style={navLink}>Promote / Export</Link>
        <Link href="/linkedin-engagement/quick-export" style={navLink}>Quick Export</Link>
        <Link href="/linkedin-engagement/search-import" style={navLink}>Search Import</Link>
      </nav>
    </aside>
  );
}
