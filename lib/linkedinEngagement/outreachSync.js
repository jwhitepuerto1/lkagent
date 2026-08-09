// lib/linkedinEngagement/outreachSync.js
//
// Tracks outcomes of John's manually-sent invites and DMs. Never sends
// anything - read-only polling per the spec's "human-controlled outreach"
// principle (section 4.1).
import { listSentInvitations, getProfile, listChats, getChatMessages } from "./unipileClient.js";
import { upsertProfileStub } from "./profileStub.js";

// Spec's own "Detecting Accepted Invitations" guidance: space these checks
// out a few times a day with random delay, not fixed times, to avoid
// LinkedIn's automation detection. Enforced by the caller's schedule
// (n8n cron jitter), not by this function.
export async function syncInvites(prisma) {
  const sent = await listSentInvitations();
  const currentIds = new Set(sent.map((inv) => inv.id));

  for (const inv of sent) {
    const linkedinUrn = inv.invited_user_id;
    if (!linkedinUrn) continue;

    const profile = await upsertProfileStub(prisma, {
      linkedinUrn,
      publicUrl: inv.invited_user_public_id
        ? `https://www.linkedin.com/in/${inv.invited_user_public_id}`
        : null,
      fullName: inv.invited_user || null,
      headline: inv.invited_user_description || null,
    });

    await prisma.outreachInvite.upsert({
      where: { unipileInvitationId: inv.id },
      update: { lastCheckedAt: new Date() },
      create: {
        profileId: profile.id,
        unipileInvitationId: inv.id,
        invitationText: inv.invitation_text || null,
        status: "PENDING",
        sentAt: inv.parsed_datetime ? new Date(inv.parsed_datetime) : null,
      },
    });
  }

  const stillTrackedPending = await prisma.outreachInvite.findMany({
    where: { status: "PENDING" },
    include: { profile: true },
  });

  const resolved = [];
  for (const row of stillTrackedPending) {
    if (currentIds.has(row.unipileInvitationId)) continue; // still pending, nothing to do

    let newStatus = "DECLINED_OR_WITHDRAWN";
    try {
      const profileData = await getProfile(row.profile.linkedinUrn);
      if (profileData?.network_distance === "FIRST_DEGREE") newStatus = "ACCEPTED";
    } catch {
      // Could not confirm (profile locked/deleted/rate-limited) - leave the
      // conservative DECLINED_OR_WITHDRAWN default rather than guessing.
    }

    await prisma.$transaction([
      prisma.outreachInvite.update({
        where: { id: row.id },
        data: { status: newStatus, resolvedAt: new Date(), lastCheckedAt: new Date() },
      }),
      ...(newStatus === "ACCEPTED"
        ? [
            prisma.engagementProfile.update({
              where: { id: row.profileId },
              data: { lastInboundAt: new Date(), connectionDeg: "FIRST_DEGREE" },
            }),
          ]
        : []),
    ]);

    resolved.push({ profileId: row.profileId, invitationId: row.id, status: newStatus });
  }

  return { pendingCount: sent.length, resolvedCount: resolved.length, resolved };
}

// One row per chat with a first-degree connection. Direction comes from the
// confirmed `is_sender` field on each message (1 = John sent it).
export async function syncConversations(prisma, { chatLimit = 50, messageLimit = 10 } = {}) {
  const chats = await listChats({ limit: chatLimit });

  let checked = 0;
  let newlyAwaitingResponse = 0;

  for (const chat of chats) {
    const attendeeUrn = chat.attendee_provider_id;
    if (!attendeeUrn || !chat.id) continue;

    let messages;
    try {
      messages = await getChatMessages(chat.id, { limit: messageLimit });
    } catch {
      continue; // skip this chat, don't fail the whole sync
    }
    if (messages.length === 0) continue;

    // Most recent first per Unipile's documented ordering.
    const lastOutbound = messages.find((m) => m.is_sender === 1);
    const lastInbound = messages.find((m) => m.is_sender === 0);

    const lastOutboundAt = lastOutbound ? new Date(lastOutbound.timestamp) : null;
    const lastInboundAt = lastInbound ? new Date(lastInbound.timestamp) : null;
    const requiresMyResponse = Boolean(
      lastInboundAt && (!lastOutboundAt || lastInboundAt > lastOutboundAt)
    );
    const awaitingReply = Boolean(
      lastOutboundAt && (!lastInboundAt || lastOutboundAt > lastInboundAt)
    );

    const profile = await upsertProfileStub(prisma, {
      linkedinUrn: attendeeUrn,
      publicUrl: null,
      fullName: chat.name || null,
      headline: null,
    });

    // Chat list/message payloads carry no display name (confirmed - `name`
    // is always null). Only worth the extra lookup for threads that
    // actually need John's attention and don't already have a name, so a
    // 50-chat sync doesn't become 50 extra profile calls every run.
    if (!profile.fullName && requiresMyResponse) {
      try {
        const profileData = await getProfile(attendeeUrn);
        const fullName = [profileData?.first_name, profileData?.last_name].filter(Boolean).join(" ");
        if (fullName) {
          await prisma.engagementProfile.update({
            where: { id: profile.id },
            data: {
              fullName,
              headline: profileData?.headline || null,
              publicUrl: profileData?.public_identifier
                ? `https://www.linkedin.com/in/${profileData.public_identifier}`
                : null,
            },
          });
        }
      } catch {
        // Non-critical - leave unnamed rather than fail the sync.
      }
    }

    const existing = await prisma.outreachConversation.findUnique({
      where: { unipileChatId: chat.id },
    });
    const wasRequiringResponse = existing?.requiresMyResponse ?? false;

    await prisma.outreachConversation.upsert({
      where: { unipileChatId: chat.id },
      update: {
        lastOutboundAt,
        lastInboundAt,
        lastMessageSnippet: messages[0]?.text?.slice(0, 300) || null,
        awaitingReply,
        requiresMyResponse,
        lastCheckedAt: new Date(),
      },
      create: {
        profileId: profile.id,
        unipileChatId: chat.id,
        lastOutboundAt,
        lastInboundAt,
        lastMessageSnippet: messages[0]?.text?.slice(0, 300) || null,
        awaitingReply,
        requiresMyResponse,
      },
    });

    if (requiresMyResponse) {
      await prisma.engagementProfile.update({
        where: { id: profile.id },
        data: { lastInboundAt: lastInboundAt || new Date() },
      });
      if (!wasRequiringResponse) newlyAwaitingResponse++;
    }

    checked++;
  }

  return { chatsChecked: checked, newlyAwaitingResponse };
}
