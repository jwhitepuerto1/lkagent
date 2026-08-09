// lib/linkedinEngagement/csvExport.js
//
// Produces a CSV whose headers exactly match the canonical field names in
// ias_cre_agent's PEOPLE_COLUMN_ALIASES (C:\Users\jwhit\IAspecmodule\
// ias_cre_agent\importers\column_mapping.py), verified 2026-08-09. Only
// identity fields this agent can actually confirm are populated - title,
// email, seniority, department, and split city/state/country are left
// blank for that module's own enrichment (NeverBounce, EDGAR, LLM website
// review) to fill in, per the spec's "send only the minimum required data"
// principle. `headline` is used as a best-effort title proxy since it's
// often not a clean job title (e.g. "CEO at X | Founder of Y").
const CSV_COLUMNS = [
  "apollo_person_id",
  "first_name",
  "last_name",
  "full_name",
  "title",
  "seniority",
  "department",
  "email",
  "email_status",
  "person_linkedin_url",
  "person_city",
  "person_state",
  "person_country",
  "apollo_company_id",
  "company_name",
  "company_website",
  "company_linkedin_url",
];

function csvEscape(value) {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function splitName(fullName) {
  if (!fullName) return { firstName: "", lastName: "" };
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export function buildPeopleCsv(profiles) {
  const header = CSV_COLUMNS.join(",");
  const rows = profiles.map((p) => {
    const { firstName, lastName } = splitName(p.fullName);
    const row = {
      apollo_person_id: "",
      first_name: firstName,
      last_name: lastName,
      full_name: p.fullName || "",
      title: p.headline || "",
      seniority: "",
      department: "",
      email: "",
      email_status: "",
      person_linkedin_url: p.publicUrl || "",
      person_city: "",
      person_state: "",
      person_country: "",
      apollo_company_id: "",
      company_name: p.companyName || "",
      company_website: p.companyUrl || "",
      company_linkedin_url: "",
    };
    return CSV_COLUMNS.map((col) => csvEscape(row[col])).join(",");
  });
  return [header, ...rows].join("\r\n");
}
