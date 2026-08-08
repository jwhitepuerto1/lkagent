// pages/linkedin/campaigns/index.js
import { useEffect, useState } from "react";
import Link from "next/link";
import Layout from "../../../components/Layout";

export default function CampaignsIndexPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/linkedin/campaigns", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed to load campaigns");
      setCampaigns(data);
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>LinkedIn Campaigns</h1>
        <Link href="/linkedin/campaigns/new" style={{ padding: "8px 12px", border: "1px solid #333", borderRadius: 6 }}>
          + New Campaign
        </Link>
      </div>

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

      {loading ? (
        <p>Loading…</p>
      ) : campaigns.length === 0 ? (
        <p>No campaigns yet.</p>
      ) : (
        <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
          {campaigns.map((c) => (
            <Link
              key={c.id}
              href={`/linkedin/campaigns/${c.id}`}
              style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, textDecoration: "none", color: "inherit" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{c.campaignName}</div>
                  <div style={{ fontSize: 13, opacity: 0.75 }}>
                    {c.campaignDays} days • {c.insightPostCount} insight + {c.assetPostCount} asset •{" "}
                    {c.groupDestinations?.length ?? 0} groups • starts {new Date(c.startDate).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ fontWeight: 600 }}>{c.status}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}
