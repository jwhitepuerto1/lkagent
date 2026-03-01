// pages/api/leads/activityData.js

// In-memory store (resets when dev server restarts)
export const activitiesByLeadId = {
  "L-001": [
    {
      id: "A-1001",
      type: "note",
      summary: "Intro message drafted. Waiting to send after warm-up completes.",
      createdAt: "2026-01-10T10:15:00",
      by: "John",
    },
  ],
  "L-002": [
    {
      id: "A-1002",
      type: "email",
      summary: "Sent intro email + resource link. Awaiting reply.",
      createdAt: "2026-01-09T09:40:00",
      by: "John",
    },
  ],
};

export const ACTIVITY_TYPES = ["note", "call", "email", "meeting", "task"];

export function getActivities(leadId) {
  return activitiesByLeadId[leadId] || [];
}

export function addActivity(leadId, activity) {
  if (!activitiesByLeadId[leadId]) activitiesByLeadId[leadId] = [];
  activitiesByLeadId[leadId].unshift(activity); // newest first
}

export function isoDateOnly(isoString) {
  // "2026-01-10T10:15:00" -> "2026-01-10"
  return String(isoString).slice(0, 10);
}
