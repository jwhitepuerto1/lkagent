import Link from "next/link";

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
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/leads">Leads</Link>
        <Link href="/tasks">Tasks</Link>
        <Link href="/campaigns">Campaigns</Link>
        <Link href="/analytics">Analytics</Link>
      </nav>
    </aside>
  );
}
