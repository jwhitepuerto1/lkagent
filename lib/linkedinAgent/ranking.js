// lib/linkedinAgent/ranking.js
// Deterministic source selection (spec section 8.2) — no LLM involved.
// Ranks by time-since-last-use (never-used first), honoring required/
// excluded lists and a reuse cooldown, relaxing the cooldown only if it
// would otherwise leave too few candidates.

function isInCooldown(item, cooldownDays, now) {
  if (!item.lastUsedAt) return false;
  const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;
  return now.getTime() - new Date(item.lastUsedAt).getTime() < cooldownMs;
}

function rankByRecency(items) {
  return [...items].sort((a, b) => {
    const aTime = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : -Infinity;
    const bTime = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : -Infinity;
    return aTime - bTime;
  });
}

// Shared selector for topics/assets. `items` must already be filtered to
// active=true by the caller (the DB query does this).
function selectSources({
  items,
  count,
  mode,
  specifiedIds = [],
  requiredIds = [],
  excludedIds = [],
  cooldownDays,
  now = new Date(),
}) {
  const excludedSet = new Set(excludedIds);
  const eligible = items.filter((item) => !excludedSet.has(item.id));

  if (mode === "SPECIFIED") {
    const byId = new Map(eligible.map((item) => [item.id, item]));
    const selected = specifiedIds.map((id) => byId.get(id)).filter(Boolean);
    return {
      selected,
      insufficient: selected.length < count,
      relaxedCooldown: false,
    };
  }

  // AUTOMATIC
  const requiredSet = new Set(requiredIds);
  const required = eligible.filter((item) => requiredSet.has(item.id));
  const remainingPool = eligible.filter((item) => !requiredSet.has(item.id));

  const withoutCooldown = rankByRecency(
    remainingPool.filter((item) => !isInCooldown(item, cooldownDays, now))
  );

  let relaxedCooldown = false;
  let candidates = withoutCooldown;
  if (required.length + withoutCooldown.length < count) {
    relaxedCooldown = true;
    candidates = rankByRecency(remainingPool);
  }

  const needed = Math.max(0, count - required.length);
  const selected = [...required, ...candidates.slice(0, needed)];

  return {
    selected,
    insufficient: selected.length < count,
    relaxedCooldown,
  };
}

export function selectTopics(params) {
  return selectSources(params);
}

export function selectAssets(params) {
  return selectSources(params);
}

// Spec 8.3: alternate insight/asset where practical, avoid asset posts on
// consecutive days unless the requested mix makes that unavoidable.
export function buildDayTypeSequence(insightCount, assetCount) {
  const days = insightCount + assetCount;
  if (days === 0) return [];

  const majorType = insightCount >= assetCount ? "INSIGHT" : "ASSET";
  const minorType = majorType === "INSIGHT" ? "ASSET" : "INSIGHT";
  const minorCount = Math.min(insightCount, assetCount);

  const result = new Array(days).fill(majorType);
  if (minorCount === 0) return result;

  const spacing = days / minorCount;
  for (let k = 0; k < minorCount; k++) {
    const pos = Math.min(days - 1, Math.max(0, Math.round(spacing * (k + 1)) - 1));
    result[pos] = minorType;
  }
  return result;
}
