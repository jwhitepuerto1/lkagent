# LinkedIn Engagement Tracking Agent

Phase 1 only (ingestion): pulls likes and comments on the connected LinkedIn
account's recent posts via Unipile and writes normalized data to Postgres.
Phase 2 (profile enrichment - full name/headline/company backfill) was
explicitly deferred; `EngagementProfile` rows are stubs (URN + public URL
only) until that's built.

## Status: unverified against a live Unipile response

No Unipile credentials were available when this was built. The spec this
was built from explicitly calls for inspecting a real API response before
trusting group-post detection - that step could not be done. Concretely:

- **Field names are best-guess.** `lib/linkedinEngagement/unipileClient.js`,
  `ingest.js`, and `normalize.js` all extract fields from a *candidate list*
  (e.g. a post's URN might be `urn`, `id`, `post_id`, or `social_id`) rather
  than one confirmed name. Every extraction point is commented with its
  candidate list so it's a one-line change once real field names are known.
- **Group-post detection is unverified.** `detectSource.js` checks a list of
  plausible field names (`container`, `context`, `group_urn`, etc.) that
  might indicate a post's group container. Every `EngagementPost` row has a
  `sourceConfident` flag - `false` means no candidate field was present at
  all, so the `PERSONAL` default is a guess, not a detection. Query for
  `sourceConfident: false` rows to find ones worth reviewing once you have
  real data.
- **Verified separately, without live credentials:** the ingestion
  orchestration itself (idempotency, dedup, profile-stub creation, partial
  failure handling) was tested end-to-end against synthetic fixtures that
  mock the `fetch` layer only. That logic is solid; only the actual Unipile
  field mapping needs confirming.

**Before relying on this in production:** set real credentials (below), run
once, and inspect a few `EngagementPost`/`EngagementRecord` rows against
what actually happened on LinkedIn. Adjust the candidate field lists in the
three files above if anything looks wrong.

## Environment variables

Add to `.env.local`:

```
UNIPILE_API_KEY=...
UNIPILE_DSN=apiXXX.unipile.com:XXXX
UNIPILE_ACCOUNT_ID=...
UNIPILE_IDENTIFIER=me                          # optional, defaults to "me"
LINKEDIN_ENGAGEMENT_INGEST_SECRET=<random string>
```

`LINKEDIN_ENGAGEMENT_INGEST_SECRET` is a shared secret for the n8n workflow
to authenticate to `/api/linkedin-engagement/run` without a staff session
cookie. Generate any random string; set the same value in n8n's environment
config (see below) - never paste it directly into the workflow JSON.

## Manual trigger

From the admin UI: `/linkedin-engagement` → "Run ingestion now" (uses your
normal staff session).

From the command line:

```bash
curl -X POST http://localhost:3000/api/linkedin-engagement/run \
  -H "x-ingest-secret: $LINKEDIN_ENGAGEMENT_INGEST_SECRET"
```

Viewing results: `/linkedin-engagement` lists recent posts with like/comment
counts; click a post to see every individual engager (name if enriched,
otherwise their URN/public URL) and comment text. Programmatically:
`GET /api/linkedin-engagement/posts` (list) and
`GET /api/linkedin-engagement/posts?postId=<id>` (one post's full engager list).

## n8n workflow

`n8n/linkedin-engagement-daily.json` — import via n8n's UI (Workflows →
Import from File) or the API. It is intentionally thin: a daily Schedule
Trigger (07:00, edit the cron expression node to change) calls
`POST {IAS_BASE_URL}/api/linkedin-engagement/run` with the shared secret
header, with n8n's built-in retry (3 attempts, 30s apart) for transient
failures. All the actual Unipile calls, field extraction, source detection,
and idempotent DB writes live in this repo's tested code, not in the
workflow - n8n only handles scheduling and retry, since workflow-internal
logic can't be unit tested the way this repo's code can.

Set `IAS_BASE_URL` and `LINKEDIN_ENGAGEMENT_INGEST_SECRET` as n8n
environment variables before running it (n8n Settings → Environments, or
your host's env config).

There's no notification-on-failure node included - none was specified. Wire
the included "Had Warnings?" branch to whatever alerting channel you want.

## How idempotency works

- `EngagementPost.linkedinUrn` is unique - re-scanning the same post updates
  its `url`/`textSnippet` in place rather than creating a duplicate.
- `EngagementRecord` is unique on `(postId, profileId, type, commentText)`.
  **Important:** `commentText` is a non-null string with `""` as the default
  for likes/reactions, never `null` - Postgres treats every `NULL` as
  distinct from every other `NULL`, which would silently defeat this unique
  constraint for non-comment engagement types if it were nullable (as the
  original spec's schema had it). Every write goes through this same path,
  so this is enforced everywhere, not just in one code path.
- A duplicate insert attempt (unique constraint violation) is caught and
  treated as "already recorded" rather than an error - re-running the same
  day's data twice produces zero duplicate rows.
- Each run's counts and any warnings are logged to `EngagementSyncRun`,
  even on partial failure (e.g. one post's reactions fetch failing doesn't
  abort the whole run - it's logged as a warning and ingestion continues).

## Deliberate scope cuts from the original spec

- **Phase 2 (profile enrichment)** not built - `EngagementProfile` stays a
  stub until you ask for it.
- **Database target changed** from the spec's `ias_crm_platform` to the
  `ias` database already used by the LinkedIn Post Generation/Publishing
  Agent - `ias_crm_platform` turned out to belong to a separate,
  Python/Alembic-managed system unrelated to this app.
- **Model names** are prefixed (`EngagementPost`, `EngagementProfile`,
  `EngagementRecord`, `EngagementSyncRun`) rather than the spec's generic
  `Post`/`Profile`/`Engagement`/`SyncRun`, to avoid ambiguity against this
  schema's many other models (e.g. the Generation Agent's own
  `GeneratedPost`).
