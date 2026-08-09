// lib/linkedinEngagement/commentSync.js
//
// No Unipile endpoint discovers "posts John commented on" (confirmed - see
// docs/linkedin-engagement/README.md), so John logs the post URL manually
// via OutreachComment. This finds his own comment on that post by matching
// the connected account's provider-internal id (not text matching, which
// would break on edited/truncated comments), then treats any other
// author's comment appearing after his as a reply candidate. This is a
// documented approximation, not true parent-comment threading - Unipile
// does not expose a reply-to-comment field for LinkedIn comments.
import { getPostComments, resolveOwnIdentifier } from "./unipileClient.js";
import { resolvePostSocialId } from "./postIdResolver.js";
import { upsertProfileStub } from "./profileStub.js";

export async function checkCommentReplies(prisma, outreachCommentId) {
  const record = await prisma.outreachComment.findUnique({ where: { id: outreachCommentId } });
  if (!record) throw new Error("OutreachComment not found");

  let socialId = record.postSocialId;
  if (!socialId) {
    socialId = await resolvePostSocialId(record.postUrl);
    await prisma.outreachComment.update({ where: { id: record.id }, data: { postSocialId: socialId } });
  }

  const [ownId, rawComments] = await Promise.all([resolveOwnIdentifier(), getPostComments(socialId)]);

  const mine = rawComments.find((c) => c.author_details?.id === ownId);
  const myTimestamp = mine?.date ? new Date(mine.date) : record.myCommentAt || record.loggedAt;

  const candidates = rawComments.filter((c) => {
    if (c.author_details?.id === ownId) return false; // that's John's own comment
    if (!c.date) return false;
    return new Date(c.date) > myTimestamp;
  });

  let newReplies = 0;
  for (const c of candidates) {
    const replierId = c.author_details?.id;
    let profileId = null;
    if (replierId) {
      const profile = await upsertProfileStub(prisma, {
        linkedinUrn: replierId,
        publicUrl: c.author_details?.profile_url || null,
        fullName: typeof c.author === "string" ? c.author : null,
        headline: c.author_details?.headline || null,
      });
      profileId = profile.id;
    }

    try {
      await prisma.outreachCommentReply.create({
        data: {
          outreachCommentId: record.id,
          profileId,
          unipileCommentId: c.id,
          replierName: typeof c.author === "string" ? c.author : null,
          replyText: c.text || "",
          repliedAt: new Date(c.date),
        },
      });
      newReplies++;
      if (profileId) {
        await prisma.engagementProfile.update({
          where: { id: profileId },
          data: { lastInboundAt: new Date(c.date) },
        });
      }
    } catch (err) {
      if (err?.code !== "P2002") throw err; // already recorded, skip
    }
  }

  await prisma.outreachComment.update({
    where: { id: record.id },
    data: {
      lastCheckedAt: new Date(),
      status: newReplies > 0 ? "REPLIED" : record.status === "REPLIED" ? "REPLIED" : "NO_REPLY_YET",
    },
  });

  return { newReplies };
}
