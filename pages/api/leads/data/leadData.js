// pages/api/leads/data/leadData.js

let LEADS = [
  {
    id: "L-001",
    name: "Sample Lead",
    segment: "HNW",
    source: "LinkedIn",
    stage: "Prospect",
    status: "Active",
    owner: "John",
    lastTouch: "2026-01-11",

    // ✅ V1 Feature #3 fields
    priority: "Medium", // Low | Medium | High
    nextActionAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // tomorrow
  },
];

export function getAllLeads() {
  return LEADS;
}

export function getLeadById(id) {
  return LEADS.find((l) => l.id === id) || null;
}

export function updateLeadById(id, patch) {
  const idx = LEADS.findIndex((l) => l.id === id);
  if (idx === -1) return null;

  LEADS[idx] = { ...LEADS[idx], ...patch, id };
  return LEADS[idx];
}
