// pages/api/auth/me.js
import { getSessionFromReq } from "../../../lib/auth.js";

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = getSessionFromReq(req);
  if (!session) return res.status(401).json({ ok: false });

  return res.status(200).json({ ok: true, user: { role: session.role || "admin" } });
}
