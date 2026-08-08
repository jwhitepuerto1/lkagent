// pages/api/members/login.js
import prisma from "../../../lib/prisma.js";
import {
  verifyPasswordHash,
  createMemberSessionToken,
  setMemberSessionCookie,
} from "../../../lib/memberAuth.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body || {};
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    const account = email ? await prisma.memberAccount.findUnique({ where: { email } }) : null;

    if (
      !account ||
      account.status !== "ACTIVE" ||
      !verifyPasswordHash(password, account.passwordHash)
    ) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    await prisma.memberAccount.update({
      where: { id: account.id },
      data: { lastLoginAt: new Date() },
    });

    const token = createMemberSessionToken(account.id, account.partyId);
    setMemberSessionCookie(res, token);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message });
  }
}
