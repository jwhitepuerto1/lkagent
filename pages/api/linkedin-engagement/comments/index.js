// pages/api/linkedin-engagement/comments/index.js
import prisma from "../../../../lib/prisma.js";
import { requireAuth } from "../../../../lib/auth.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const session = requireAuth(req, res);
  if (!session) return;

  try {
    if (req.method === "GET") {
      const comments = await prisma.outreachComment.findMany({
        orderBy: { loggedAt: "desc" },
        include: { replies: { include: { profile: true } } },
      });
      return res.status(200).json(comments);
    }

    if (req.method === "POST") {
      const { postUrl, myCommentText } = req.body || {};
      if (!postUrl || !myCommentText) {
        return res.status(400).json({ error: "postUrl and myCommentText are required" });
      }
      const comment = await prisma.outreachComment.create({
        data: { postUrl: postUrl.trim(), myCommentText: myCommentText.trim(), myCommentAt: new Date() },
      });
      return res.status(201).json(comment);
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message });
  }
}
