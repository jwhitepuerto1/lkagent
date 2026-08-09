# Capital Context LinkedIn Engagement, Outreach Intelligence, and CRE Prospect Promotion Agent

Tracks who engages with John's LinkedIn content and manual outreach (likes,
comments, connection invites, DMs), classifies and scores each person, and
lets John flag a record for hand-off into the separate `ias_cre_agent`
enrichment module via CSV. **Fully read-only against LinkedIn** - it never
sends an invite, message, or comment; John does that manually every day
(his 20/20/20 routine), and this agent only watches for outcomes.

## Status: verified against live data (2026-08-09)

Every Unipile field mapping below was checked against real API responses
from the connected account, not left as a guess - including one place
where the fetched documentation was wrong (see "Corrections" below).

## Environment variables

```
UNIPILE_API_KEY=...
UNIPILE_DSN=apiXXX.unipile.com:XXXX
UNIPILE_ACCOUNT_ID=...
UNIPILE_IDENTIFIER=...                         # optional override; normally auto-resolved from /accounts
LINKEDIN_ENGAGEMENT_INGEST_SECRET=<random string>
ANTHROPIC_API_KEY=...                          # already required elsewhere in this app; reused for classification
```

`LINKEDIN_ENGAGEMENT_INGEST_SECRET` lets n8n call the sync endpoints without
a staff session cookie - generate any random string, set the same value in
n8n's environment config, never paste it into the workflow JSON itself.

## What's tracked, and how

### Posts, reactions, comments on your own content
`GET /users/{identifier}/posts` (identifier = provider-internal id, e.g.
`ACoA...` - auto-resolved from `GET /accounts`, "me" and the public vanity
slug both 422). Group posts carry a `group: {id, name, private}` object;
personal posts lack it entirely - this is a confirmed, documented field,
not a heuristic. Reactions/comments are fetched by a post's `social_id`
(never its shorter numeric `id` - LinkedIn has multiple ids per post).

### Invitations sent
`GET /users/invite/sent` lists only *pending* invitations - there is no
per-item status field. Acceptance is detected by an invite disappearing
from this list between polls, then confirmed via `GET /users/{id}` and
checking `network_distance === "FIRST_DEGREE"`. Unipile's own guidance:
space these checks out a few times a day with random delay, not a fixed
cron time, to avoid LinkedIn's automation detection - factor this into
whatever schedule triggers `/api/linkedin-engagement/sync-outreach`.

### DM replies
`GET /chats` + `GET /chats/{id}/messages`. Each message has a confirmed
`is_sender` field (1 = John sent it, 0 = received) - direction is read
directly from this, not inferred. Chat/message payloads never include a
display name, so a targeted `GET /users/{id}` lookup backfills the name
only for threads that actually need John's attention (not all 50+ chats
every run).

### Comment replies (on posts John commented on, not his own)
No Unipile endpoint discovers "posts John commented on" - he logs the post
URL and his own comment text manually via `/linkedin-engagement/comments`.
The agent resolves the URL to a `social_id`, finds John's own comment by
matching the connected account's provider-internal id (not text matching),
and treats any other author's comment appearing after it as a reply
candidate. This is a documented approximation, not true parent-comment
threading - Unipile does not expose a reply-to-comment field for LinkedIn.

### Corrections found by checking live data instead of trusting docs
- The fetched Unipile docs said a comment's `author` field was the
  commenter's ID string. The real payload has `author` as their **display
  name**; the actual ID is under `author_details.id`. Caught by fetching a
  real comment before writing `normalize.js`.
  
## Classification and scoring

`lib/linkedinEngagement/classify.js` calls Claude to assign one of 12
categories (spec-defined) with confidence and evidence - the LLM
classifies, it does not score (per the spec's own principle: agents
extract/classify, deterministic code scores). `scoring.js` computes
engagement/fit/priority scores from fixed weights and the classification,
storing a `scoreFactors` JSON breakdown so the UI can show why a score is
what it is. This is a lightweight LinkedIn-side proxy for prioritizing
John's limited daily actions - **not** the rigorous evidence-based fit
engine described in the separate investor-side IAM module or
`ias_cre_agent`'s own scoring.

Manual overrides (`PATCH /api/linkedin-engagement/profiles/{id}` with
`primaryCategory`) set `classificationOverridden=true`, which the batch
classifier respects permanently until explicitly reset.

## Promote to CRE Prospect → CSV → ias_cre_agent

`/linkedin-engagement/promote` lets John select records and flag them
(`PromotionExport` batch + `EngagementProfile.status=PROMOTED`), then
download a CSV. **This agent never talks to `ias_cre_agent` directly** -
John submits the file himself. The CSV headers exactly match the canonical
field names in `ias_cre_agent`'s `PEOPLE_COLUMN_ALIASES`
(`C:\Users\jwhit\IAspecmodule\ias_cre_agent\importers\column_mapping.py`,
verified by reading it directly), so it should import in that module with
no column-mapping surprises. Only confirmed identity fields are populated
(name, LinkedIn URL, company name/site if known) - title, email,
seniority, department, and split city/state/country are left blank for
that module's own NeverBounce/EDGAR/LLM-website-fit enrichment to fill in,
per the "send only the minimum required data" principle. `headline` is
used as a best-effort `title` proxy since it's rarely a clean job title.

A profile with no name at all is rejected at promotion time
(`skippedNoName` in the response) rather than producing a blank CSV row
that module's own importer would flag as `MISSING_NAME` anyway.

## Daily queues

`/linkedin-engagement/queues` - replies requiring attention, new
comments/reactions (last 3 days), newly accepted invitations, follow-ups
due, and 20/20/20 candidate lists (invitation candidates, DM/follow-up
candidates). The connected account's own identifier is excluded from both
candidate lists - self-reactions on your own content otherwise attribute
back to your own profile and would recommend inviting/DMing yourself.
"Prospect posts worth commenting on" is intentionally not included - no
Unipile endpoint discovers other people's posts, so this queue would have
to be fabricated rather than derived from real data.

## Manual trigger / API surface

```bash
curl -X POST http://localhost:3000/api/linkedin-engagement/run -H "x-ingest-secret: $LINKEDIN_ENGAGEMENT_INGEST_SECRET"
curl -X POST http://localhost:3000/api/linkedin-engagement/sync-outreach -H "x-ingest-secret: $LINKEDIN_ENGAGEMENT_INGEST_SECRET"
curl -X POST http://localhost:3000/api/linkedin-engagement/classify -H "Cookie: ..."   # batch-classify unscored profiles
```

## n8n workflow

`n8n/linkedin-engagement-daily.json` is a thin daily Schedule Trigger that
calls `/api/linkedin-engagement/run` - all business logic lives in this
repo's tested code, not in the workflow, since workflow-internal logic
can't be unit tested the way this repo's code can. It does not yet call
`sync-outreach` or `classify` - add additional HTTP Request nodes for those
if you want them on the same schedule (with jittered timing for
`sync-outreach`, per the invitation-detection guidance above).

## How idempotency works

- `EngagementPost.linkedinUrn`, `OutreachInvite.unipileInvitationId`,
  `OutreachConversation.unipileChatId`, and
  `OutreachCommentReply.unipileCommentId` are all unique - re-polling never
  duplicates a row, it upserts/updates in place.
- `EngagementRecord` is unique on `(postId, profileId, type, commentText)`
  with `commentText` as a non-null empty-string default, never `null` -
  Postgres treats every `NULL` as distinct from every other `NULL`, which
  would silently defeat this constraint for likes/reactions if it were
  nullable (as the original spec's own schema had it).
- A duplicate insert attempt (unique constraint violation) is caught and
  treated as "already recorded," not an error.

## Deliberate scope cuts

- **No live posting/messaging/inviting** - confirmed explicitly with John;
  this agent is permanently read-only against LinkedIn by design, not just
  in this phase.
- **CSV hand-off, not API integration** - `ias_cre_agent` is a separate,
  completed module; this agent produces a compatible file, nothing more.
- **Full evidence-based fit/qualification scoring** (HNW/Family
  Office/RIA-style deterministic gates) lives in the separate investor-side
  IAM module, not here - this agent's scoring is a much lighter
  prioritization proxy for a single user's daily manual actions.
- **Duplicate/suppression checks against `ias_cre_agent`'s own data** are
  that module's job at import time, not this agent's.
