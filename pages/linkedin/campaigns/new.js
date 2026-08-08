// pages/linkedin/campaigns/new.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../../../components/Layout";

const inputStyle = { padding: "8px 10px", border: "1px solid #ccc", borderRadius: 6, width: "100%" };
const labelStyle = { fontSize: 13, fontWeight: 600, marginTop: 10, display: "block" };

export default function NewCampaignPage() {
  const router = useRouter();

  const [destinations, setDestinations] = useState([]);
  const [loadingDestinations, setLoadingDestinations] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [campaignName, setCampaignName] = useState("");
  const [campaignDays, setCampaignDays] = useState(5);
  const [insightPostCount, setInsightPostCount] = useState(3);
  const [assetPostCount, setAssetPostCount] = useState(2);
  const [startDate, setStartDate] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [personalDestinationId, setPersonalDestinationId] = useState("");
  const [companyDestinationId, setCompanyDestinationId] = useState("");
  const [groupDestinationIds, setGroupDestinationIds] = useState([]);

  const [tone, setTone] = useState("professional");
  const [postLength, setPostLength] = useState("standard");
  const [ctaStrength, setCtaStrength] = useState("standard");
  const [useHashtags, setUseHashtags] = useState(true);
  const [maxHashtags, setMaxHashtags] = useState(3);
  const [includeQuestion, setIncludeQuestion] = useState(true);
  const [groupPersonalizationLevel, setGroupPersonalizationLevel] = useState("individual_group");

  useEffect(() => {
    async function load() {
      setLoadingDestinations(true);
      try {
        const res = await fetch("/api/linkedin/destinations?status=ACTIVE", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load destinations");
        setDestinations(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoadingDestinations(false);
      }
    }
    load();
  }, []);

  const personals = destinations.filter((d) => d.destinationType === "PERSONAL");
  const companies = destinations.filter((d) => d.destinationType === "COMPANY");
  const groups = destinations.filter((d) => d.destinationType === "GROUP");

  function toggleGroup(id) {
    setGroupDestinationIds((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  }

  const countsMatch = Number(insightPostCount) + Number(assetPostCount) === Number(campaignDays);
  const groupCountOk = groupDestinationIds.length >= 6 && groupDestinationIds.length <= 9;

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/linkedin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignName,
          campaignDays: Number(campaignDays),
          insightPostCount: Number(insightPostCount),
          assetPostCount: Number(assetPostCount),
          startDate,
          timezone,
          personalDestinationId,
          companyDestinationId,
          groupDestinationIds,
          topicSelection: { mode: "automatic" },
          assetSelection: { mode: "automatic" },
          style: {
            tone,
            post_length: postLength,
            cta_strength: ctaStrength,
            use_hashtags: useHashtags,
            max_hashtags: Number(maxHashtags),
            include_question: includeQuestion,
            group_personalization_level: groupPersonalizationLevel,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed to create campaign");
      router.push(`/linkedin/campaigns/${data.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <h1>New LinkedIn Campaign</h1>

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
      {loadingDestinations ? <p>Loading destinations…</p> : null}

      <form onSubmit={onSubmit} style={{ maxWidth: 640 }}>
        <label style={labelStyle}>Campaign name</label>
        <input style={inputStyle} value={campaignName} onChange={(e) => setCampaignName(e.target.value)} required />

        <label style={labelStyle}>Campaign length</label>
        <select style={inputStyle} value={campaignDays} onChange={(e) => setCampaignDays(Number(e.target.value))}>
          <option value={5}>5 days</option>
          <option value={10}>10 days</option>
        </select>

        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Insight posts</label>
            <input type="number" min={0} style={inputStyle} value={insightPostCount} onChange={(e) => setInsightPostCount(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Asset posts</label>
            <input type="number" min={0} style={inputStyle} value={assetPostCount} onChange={(e) => setAssetPostCount(e.target.value)} />
          </div>
        </div>

        <p style={{ fontSize: 13, marginTop: 6, color: countsMatch ? "green" : "crimson" }}>
          {insightPostCount} insight + {assetPostCount} asset = {Number(insightPostCount) + Number(assetPostCount)} campaign days
          {countsMatch ? " ✓" : ` (must equal ${campaignDays})`}
        </p>

        <label style={labelStyle}>Start date</label>
        <input type="date" style={inputStyle} value={startDate} onChange={(e) => setStartDate(e.target.value)} required />

        <label style={labelStyle}>Timezone (IANA)</label>
        <input style={inputStyle} value={timezone} onChange={(e) => setTimezone(e.target.value)} />

        <label style={labelStyle}>Personal profile</label>
        <select style={inputStyle} value={personalDestinationId} onChange={(e) => setPersonalDestinationId(e.target.value)} required>
          <option value="">Select…</option>
          {personals.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        <label style={labelStyle}>Company Page</label>
        <select style={inputStyle} value={companyDestinationId} onChange={(e) => setCompanyDestinationId(e.target.value)} required>
          <option value="">Select…</option>
          {companies.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        <label style={labelStyle}>Groups (6–9)</label>
        <div style={{ border: "1px solid #ccc", borderRadius: 6, padding: 10, maxHeight: 220, overflowY: "auto" }}>
          {groups.map((g) => (
            <label key={g.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <input type="checkbox" checked={groupDestinationIds.includes(g.id)} onChange={() => toggleGroup(g.id)} />
              {g.name}
            </label>
          ))}
          {groups.length === 0 ? <p style={{ opacity: 0.7, margin: 0 }}>No active groups yet.</p> : null}
        </div>
        <p style={{ fontSize: 13, color: groupCountOk ? "green" : "crimson" }}>
          {groupDestinationIds.length} selected {groupCountOk ? "✓" : "(need 6-9)"}
        </p>

        <h3>Style</h3>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Tone</label>
            <select style={inputStyle} value={tone} onChange={(e) => setTone(e.target.value)}>
              <option value="professional">Professional</option>
              <option value="direct">Direct</option>
              <option value="analytical">Analytical</option>
              <option value="conversational">Conversational</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Post length</label>
            <select style={inputStyle} value={postLength} onChange={(e) => setPostLength(e.target.value)}>
              <option value="short">Short</option>
              <option value="standard">Standard</option>
              <option value="long">Long</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>CTA strength</label>
            <select style={inputStyle} value={ctaStrength} onChange={(e) => setCtaStrength(e.target.value)}>
              <option value="soft">Soft</option>
              <option value="standard">Standard</option>
              <option value="direct">Direct</option>
            </select>
          </div>
        </div>

        <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={useHashtags} onChange={(e) => setUseHashtags(e.target.checked)} />
          Use hashtags
        </label>
        {useHashtags ? (
          <>
            <label style={labelStyle}>Max hashtags</label>
            <input type="number" min={0} max={10} style={inputStyle} value={maxHashtags} onChange={(e) => setMaxHashtags(e.target.value)} />
          </>
        ) : null}

        <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={includeQuestion} onChange={(e) => setIncludeQuestion(e.target.checked)} />
          Include a question where natural
        </label>

        <label style={labelStyle}>Group personalization level</label>
        <select style={inputStyle} value={groupPersonalizationLevel} onChange={(e) => setGroupPersonalizationLevel(e.target.value)}>
          <option value="category">Category</option>
          <option value="individual_group">Individual group</option>
        </select>

        <button
          type="submit"
          disabled={saving || !countsMatch || !groupCountOk}
          style={{ marginTop: 20, padding: "10px 16px" }}
        >
          {saving ? "Creating…" : "Create campaign"}
        </button>
      </form>
    </Layout>
  );
}
