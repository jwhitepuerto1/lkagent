// pages/api/members/register.js
import prisma from "../../../lib/prisma.js";
import {
  hashPassword,
  createMemberSessionToken,
  setMemberSessionCookie,
} from "../../../lib/memberAuth.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body || {};
    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!firstName || !lastName) {
      return res.status(400).json({ error: "First and last name are required" });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: "A valid email is required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const account = await prisma.$transaction(async (tx) => {
      const party = await tx.party.create({
        data: { type: "PERSON", displayName: `${firstName} ${lastName}` },
      });

      await tx.contactPoint.create({
        data: {
          partyId: party.id,
          type: "EMAIL",
          valueRaw: body.email,
          valueNormalized: email,
          isPrimary: true,
          isVerified: false,
          source: "member-registration",
        },
      });

      const created = await tx.memberAccount.create({
        data: {
          partyId: party.id,
          firstName,
          lastName,
          email,
          passwordHash: hashPassword(password),
        },
      });

      await tx.entitlement.create({
        data: {
          partyId: party.id,
          module: "RESOURCES",
          status: "GRANTED",
          grantedAt: new Date(),
        },
      });

      return created;
    });

    const token = createMemberSessionToken(account.id, account.partyId);
    setMemberSessionCookie(res, token);
    return res.status(201).json({ ok: true });
  } catch (err) {
    if (err?.code === "P2002") {
      return res.status(409).json({ error: "Email already registered" });
    }
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message });
  }
}
