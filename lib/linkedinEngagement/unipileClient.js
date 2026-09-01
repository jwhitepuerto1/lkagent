// lib/linkedinEngagement/unipileClient.js
//
// Thin fetch wrapper around the Unipile API (LinkedIn provider). Verified
// against a live account (2026-08-09):
// - Auth: X-API-KEY header, base URL https://{UNIPILE_DSN}/api/v1.
// - GET /api/v1/accounts lists connected accounts; each account's
//   connection_params.im.id is the "provider internal id" LinkedIn expects
//   (starts with ACo/ADo) for /users/{identifier}/posts - NOT "me" and NOT
//   the public_identifier vanity slug, both of which 422 with
//   "invalid_recipient".
// - GET /users/{identifier}/posts?account_id&is_company=false returns
//   { object: "PostList", items: [...], cursor, paging }. Group posts carry
//   a `group: {id, name, private}` field; personal posts lack it entirely
//   (see detectSource.js).
// - Reactions/comments must be looked up by a post's `social_id` (its
//   stable URN), never the shorter numeric `id` - LinkedIn has multiple ids
//   per post and only social_id works reliably for both endpoints.
function getConfig() {
  const apiKey = process.env.UNIPILE_API_KEY;
  const dsn = process.env.UNIPILE_DSN;
  const accountId = process.env.UNIPILE_ACCOUNT_ID;
  if (!apiKey || !dsn || !accountId) {
    throw new Error(
      "UNIPILE_API_KEY, UNIPILE_DSN, and UNIPILE_ACCOUNT_ID must all be set in .env.local"
    );
  }
  return { apiKey, dsn, accountId };
}

async function unipileGet(path, params = {}) {
  const { apiKey, dsn, accountId } = getConfig();
  const url = new URL(`https://${dsn}/api/v1${path}`);
  if (params.account_id !== false) url.searchParams.set("account_id", accountId);
  for (const [key, value] of Object.entries(params)) {
    if (key === "account_id") continue;
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { "X-API-KEY": apiKey, accept: "application/json" },
  });

  if (!res.ok) {
    const bodyText = await res.text();
    throw new Error(`Unipile API error ${res.status} on ${path}: ${bodyText}`);
  }

  return res.json();
}

async function unipilePost(path, { params = {}, body } = {}) {
  const { apiKey, dsn, accountId } = getConfig();
  const url = new URL(`https://${dsn}/api/v1${path}`);
  url.searchParams.set("account_id", accountId);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  }

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "X-API-KEY": apiKey, accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify(body || {}),
  });

  if (!res.ok) {
    const bodyText = await res.text();
    throw new Error(`Unipile API error ${res.status} on ${path}: ${bodyText}`);
  }

  return res.json();
}

// Resolves the connected LinkedIn account's provider-internal id
// (ACo.../ADo...) needed as the {identifier} path segment for
// /users/{identifier}/posts. Not cached across calls - one extra cheap
// request per ingestion run, traded for never needing a manually
// configured UNIPILE_IDENTIFIER that could drift from the real account.
async function resolveOwnIdentifier() {
  const { accountId } = getConfig();
  if (process.env.UNIPILE_IDENTIFIER) return process.env.UNIPILE_IDENTIFIER;

  const data = await unipileGet("/accounts", { account_id: false });
  const items = Array.isArray(data) ? data : data?.items || [];
  const account = items.find((a) => a.id === accountId);
  const identifier = account?.connection_params?.im?.id;
  if (!identifier) {
    throw new Error(
      `Could not resolve a provider-internal id for Unipile account ${accountId}. Set UNIPILE_IDENTIFIER explicitly.`
    );
  }
  return identifier;
}

export { resolveOwnIdentifier };

// CONFIRMED against a live Unipile response (2026-08-27): result items look
// like { type:"PEOPLE", id (the ACo... urn), name, headline, profile_url,
// public_profile_url, location, network_distance:"DISTANCE_1", ... } - see
// normalizeSearchResult() in normalize.js. No structured company field
// exists (same as engagement data - headline is the only proxy). Note: a
// requested limit of 3 still returned 10 items in testing, so treat `limit`
// as a rough cap, not exact.
//
// api: "classic" | "sales_navigator" - per Unipile's own limits doc
// (developer.unipile.com/docs/provider-limits-and-restrictions), a single
// search query is capped at 1,000 results on Classic and 2,500 on Sales
// Navigator, LinkedIn-side, not a Unipile daily quota - their documented
// workaround is exactly "filter your query using parameters and perform
// multiple [narrower] searches" rather than one broad one. Whether
// "sales_navigator" actually works depends on the connected LinkedIn
// account having that subscription - verify live before relying on it.
//
// networkDistance defaults to [1] (1st-degree only, the original scope of
// this tool) but accepts any subset of [1,2,3] - confirmed live (2026-08-27)
// that restricting to 1st-degree only can legitimately return a small
// result set (paging.total_count matched exactly what came back, not a
// truncation) since it's a small slice of a whole keyword match. Widening
// to 2nd/3rd-degree is how Sales Navigator is normally used for prospecting
// outside your existing network.
export async function searchPeople({ keywords, limit = 50, cursor, api = "classic", networkDistance = [1] } = {}) {
  if (!keywords) throw new Error("keywords is required");
  const data = await unipilePost("/linkedin/search", {
    params: { limit, cursor },
    body: { api, category: "people", keywords, network_distance: networkDistance },
  });
  return Array.isArray(data) ? data : data?.items || [];
}

export async function listRecentPosts({ limit = 50 } = {}) {
  const identifier = await resolveOwnIdentifier();
  const data = await unipileGet(`/users/${identifier}/posts`, { is_company: "false", limit });
  return Array.isArray(data) ? data : data?.items || [];
}

// Per Unipile's own documented pattern ("if you have only a URL of a post,
// take the id in the URL, use the retrieve post route with this id and
// take the social_id from the result") - unverified against a live call at
// build time, verify the first time comment-reply tracking is actually
// used against a real pasted URL.
export async function getPost(identifier) {
  return unipileGet(`/posts/${encodeURIComponent(identifier)}`);
}

// postId must be a post's social_id (URN), not its shorter numeric id.
export async function getPostReactions(postId) {
  const data = await unipileGet(`/posts/${encodeURIComponent(postId)}/reactions`);
  return Array.isArray(data) ? data : data?.items || [];
}

export async function getPostComments(postId) {
  const data = await unipileGet(`/posts/${encodeURIComponent(postId)}/comments`);
  return Array.isArray(data) ? data : data?.items || [];
}

// Confirmed (2026-08-09): GET /users/invite/sent lists only PENDING sent
// invitations - there is no per-item "status" field. Acceptance is detected
// by an invite disappearing from this list between polls (see
// outreachSync.js), not from anything in this response itself.
export async function listSentInvitations() {
  const data = await unipileGet("/users/invite/sent");
  return Array.isArray(data) ? data : data?.items || [];
}

// Confirmed real field for acceptance confirmation: network_distance ===
// "FIRST_DEGREE" means connected. identifier is the person's provider
// internal id (the same id shape as invited_user_id from listSentInvitations).
export async function getProfile(identifier) {
  return unipileGet(`/users/${encodeURIComponent(identifier)}`);
}

// Confirmed shape: { object:"ChatList", items:[{id, attendee_provider_id,
// timestamp, unread_count, ...}], cursor }.
export async function listChats({ limit = 50 } = {}) {
  const data = await unipileGet("/chats", { limit });
  return Array.isArray(data) ? data : data?.items || [];
}

// Confirmed shape: { object:"MessageList", items:[{id, text, is_sender (1
// if John sent it, 0 if received), sender_id, timestamp, ...}] }. Most
// recent first.
export async function getChatMessages(chatId, { limit = 20 } = {}) {
  const data = await unipileGet(`/chats/${encodeURIComponent(chatId)}/messages`, { limit });
  return Array.isArray(data) ? data : data?.items || [];
}
