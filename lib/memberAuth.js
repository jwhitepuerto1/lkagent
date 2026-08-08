// lib/memberAuth.js
// Self-service member auth (separate from the internal admin auth in lib/auth.js).
import crypto from "crypto";
import prisma from "./prisma.js";

const COOKIE_NAME = "ias_member_session";
const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const SCRYPT_KEYLEN = 64;

function b64urlEncode(buf) {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function b64urlDecode(str) {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
  return Buffer.from(b64 + pad, "base64");
}

function sign(secret, data) {
  return b64urlEncode(crypto.createHmac("sha256", secret).update(data).digest());
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  header.split(";").forEach((part) => {
    const idx = part.indexOf("=");
    if (idx === -1) return;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    out[k] = decodeURIComponent(v);
  });
  return out;
}

function serializeCookie(name, value, { maxAge, secure } = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`, "Path=/", "HttpOnly", "SameSite=Lax"];
  if (maxAge != null) parts.push(`Max-Age=${maxAge}`);
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(password), salt, SCRYPT_KEYLEN).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPasswordHash(password, stored) {
  const [salt, hash] = String(stored || "").split(":");
  if (!salt || !hash) return false;

  const candidate = crypto.scryptSync(String(password), salt, SCRYPT_KEYLEN);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return crypto.timingSafeEqual(candidate, expected);
}

export function setMemberSessionCookie(res, token) {
  const secure = process.env.NODE_ENV === "production";
  res.setHeader(
    "Set-Cookie",
    serializeCookie(COOKIE_NAME, token, { maxAge: TTL_SECONDS, secure })
  );
}

export function clearMemberSessionCookie(res) {
  const secure = process.env.NODE_ENV === "production";
  res.setHeader("Set-Cookie", serializeCookie(COOKIE_NAME, "", { maxAge: 0, secure }));
}

export function createMemberSessionToken(memberAccountId, partyId) {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET must be set (32+ chars)");

  const now = Math.floor(Date.now() / 1000);
  const payload = { sub: memberAccountId, partyId, iat: now, exp: now + TTL_SECONDS };

  const body = b64urlEncode(Buffer.from(JSON.stringify(payload), "utf8"));
  const sig = sign(secret, body);
  return `${body}.${sig}`;
}

export function getMemberSessionFromReq(req) {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) return null;

  const cookies = parseCookies(req.headers?.cookie || "");
  const token = cookies[COOKIE_NAME];
  if (!token) return null;

  const [body, sig] = String(token).split(".");
  if (!body || !sig) return null;

  const expected = sign(secret, body);

  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;

  let payload;
  try {
    payload = JSON.parse(b64urlDecode(body).toString("utf8"));
  } catch {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (!payload?.exp || now > payload.exp) return null;

  return payload;
}

// Decodes the session cookie, then loads the current MemberAccount + Entitlements
// from the DB so a disabled account or changed entitlements take effect immediately
// (not just on next login).
export async function getMemberFromReq(req) {
  const session = getMemberSessionFromReq(req);
  if (!session) return null;

  const account = await prisma.memberAccount.findUnique({
    where: { id: session.sub },
    include: { party: { include: { entitlements: true } } },
  });

  if (!account || account.status !== "ACTIVE") return null;

  return {
    id: account.id,
    partyId: account.partyId,
    firstName: account.firstName,
    lastName: account.lastName,
    email: account.email,
    entitlements: account.party.entitlements,
  };
}

export function hasEntitlement(entitlements, module) {
  return (entitlements || []).some((e) => e.module === module && e.status === "GRANTED");
}
