// pages/api/linkedin-engagement/search-export.js
// POST { profiles: [...] } -> CSV in the same confirmed ias_cre_agent
// column format as export.js/export-quick.js (buildPeopleCsv). Unlike
// those, this takes the profile objects directly in the request body
// instead of looking them up by id in the database - search results are
// never written to EngagementProfile (see search.js), so there's nothing
// to look up. profiles must already be in normalizeSearchResult's shape
// (fullName, headline, publicUrl, companyName, companyUrl).
import { requireAuth } from "../../../lib/auth.js";
import { buildPeopleCsv } from "../../../lib/linkedinEngagement/csvExport.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const session = requireAuth(req, res);
  if (!session) return;

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const profiles = Array.isArray(req.body?.profiles) ? req.body.profiles : [];
    if (profiles.length === 0) {
      return res.status(400).json({ error: "profiles is required and must be non-empty." });
    }

    const csv = buildPeopleCsv(profiles);
    const fileName = `linkedin-search-export-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    return res.status(200).send(csv);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message });
  }
}
