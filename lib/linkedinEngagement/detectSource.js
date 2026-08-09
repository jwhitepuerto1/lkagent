// lib/linkedinEngagement/detectSource.js
//
// CONFIRMED against a live Unipile response (2026-08-09): a post made in a
// LinkedIn Group carries a `group: { id, name, private }` object; a
// personal-feed post has no `group` key at all. This is no longer a
// heuristic - it's a documented, verified field
// (https://developer.unipile.com/reference/userscontroller_listallposts).
//
// rawPost: the raw JSON object for one post from listRecentPosts().
export function detectSource(rawPost) {
  if (rawPost.group && typeof rawPost.group === "object") {
    return { source: "GROUP", confident: true };
  }
  return { source: "PERSONAL", confident: true };
}
