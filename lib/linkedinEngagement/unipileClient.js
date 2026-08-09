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

export async function listRecentPosts({ limit = 50 } = {}) {
  const identifier = await resolveOwnIdentifier();
  const data = await unipileGet(`/users/${identifier}/posts`, { is_company: "false", limit });
  return Array.isArray(data) ? data : data?.items || [];
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
