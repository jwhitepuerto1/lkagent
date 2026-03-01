// lib/auth.js
import crypto from "crypto";

const COOKIE_NAME = "ias_session";
const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

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

export function setSessionCookie(res, token) {
  const secure = process.env.NODE_ENV === "production";
  res.setHeader(
    "Set-Cookie",
    serializeCookie(COOKIE_NAME, token, { maxAge: TTL_SECONDS, secure })
  );
}

export function clearSessionCookie(res) {
  const secure = process.env.NODE_ENV === "production";
  res.setHeader("Set-Cookie", serializeCookie(COOKIE_NAME, "", { maxAge: 0, secure }));
}

export function createSessionToken() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET must be set (32+ chars)");

  const now = Math.floor(Date.now() / 1000);
  const payload = { sub: "single-tenant", role: "admin", iat: now, exp: now + TTL_SECONDS };

  const body = b64urlEncode(Buffer.from(JSON.stringify(payload), "utf8"));
  const sig = sign(secret, body);
  return `${body}.${sig}`;
}

export function getSessionFromReq(req) {
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

export function requireAuth(req, res) {
  const session = getSessionFromReq(req);
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return session;
}

export function verifyPassword(inputPassword) {
  const expected = String(process.env.AUTH_PASSWORD || "").trim();
  const input = String(inputPassword || "").trim();
  if (!expected) return false;

  const a = Buffer.from(expected);
  const b = Buffer.from(input);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
