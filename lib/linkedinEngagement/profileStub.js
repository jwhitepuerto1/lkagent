// lib/linkedinEngagement/profileStub.js
// Shared by ingest.js and outreachSync.js - every code path that discovers a
// LinkedIn person (reactions, comments, invites, DM attendees) goes through
// this one function, so EngagementProfile stays the single canonical person
// record rather than fragmenting per discovery source.
export async function upsertProfileStub(tx, { linkedinUrn, publicUrl, fullName, headline }) {
  const existing = await tx.engagementProfile.findUnique({ where: { linkedinUrn } });
  if (existing) {
    const patch = {};
    if (!existing.publicUrl && publicUrl) patch.publicUrl = publicUrl;
    if (!existing.fullName && fullName) patch.fullName = fullName;
    if (!existing.headline && headline) patch.headline = headline;
    if (Object.keys(patch).length === 0) return existing;
    return tx.engagementProfile.update({ where: { id: existing.id }, data: patch });
  }
  try {
    return await tx.engagementProfile.create({
      data: { linkedinUrn, publicUrl: publicUrl || null, fullName: fullName || null, headline: headline || null },
    });
  } catch (err) {
    // Race with another concurrent run, or publicUrl collided with a
    // different profile's - fall back to whatever's there under this URN.
    if (err?.code === "P2002") {
      const retry = await tx.engagementProfile.findUnique({ where: { linkedinUrn } });
      if (retry) return retry;
    }
    throw err;
  }
}
