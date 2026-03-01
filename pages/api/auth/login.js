// pages/api/auth/login.js
import { createSessionToken, setSessionCookie, verifyPassword } from "../../../lib/auth.js";

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { password } = req.body || {};
    if (!verifyPassword(password)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = createSessionToken();
    setSessionCookie(res, token);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal Server Error", message: e?.message });
  }
}
