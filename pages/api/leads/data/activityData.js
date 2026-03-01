let ACTIVITIES = [];

function makeId() {
  return "A-" + Math.random().toString(16).slice(2, 10).toUpperCase();
}

export function getActivitiesByLeadId(leadId) {
  return ACTIVITIES
    .filter((a) => a.leadId === leadId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function addActivityForLead(leadId, activity) {
  const created = {
    id: makeId(),
    leadId,
    type: activity.type,
    summary: activity.summary,
    by: activity.by || "System",
    createdAt: new Date().toISOString(),
  };

  ACTIVITIES = [created, ...ACTIVITIES];
  return created;
}
