// lib/linkedinAgent/constants.js
// Central place for Phase-1 config defaults that the spec says must be
// admin-editable rather than hardcoded. Defaults here seed PlatformConfig /
// PublishingControl on first read; the DB row is the source of truth once it exists.

export const DEFAULT_CHAR_LIMIT = 3000;
export const DEFAULT_SIMILARITY_THRESHOLD = 0.82;
export const DEFAULT_DUPLICATE_LOOKBACK_DAYS = 90;
export const DEFAULT_REUSE_COOLDOWN_DAYS = 30;

export const GROUP_COUNT_MIN = 6;
export const GROUP_COUNT_MAX = 9;
export const CAMPAIGN_DAYS_ALLOWED = [5, 10];
export const REQUIRED_TOPIC_SLOTS = 10;

export const ASSET_TYPES = [
  "report",
  "guide",
  "checklist",
  "scorecard",
  "course",
  "briefing",
  "video",
  "other",
];

export const URL_PLACEMENT_POLICIES = ["end", "top_and_bottom"];

export const TONE_OPTIONS = ["professional", "direct", "analytical", "conversational"];
export const POST_LENGTH_OPTIONS = ["short", "standard", "long"];
export const CTA_STRENGTH_OPTIONS = ["soft", "standard", "direct"];
export const GROUP_PERSONALIZATION_LEVELS = ["category", "individual_group"];

export const ANTHROPIC_MODEL = "claude-sonnet-4-5-20250929";

export const CONTROL_ROW_ID = "global";
