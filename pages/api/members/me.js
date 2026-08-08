// pages/api/members/me.js
import { getMemberFromReq } from "../../../lib/memberAuth.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const member = await getMemberFromReq(req);
  if (!member) return res.status(401).json({ ok: false });

  return res.status(200).json({
    ok: true,
    member: {
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      entitlements: member.entitlements.map((e) => ({ module: e.module, status: e.status })),
    },
  });
}
