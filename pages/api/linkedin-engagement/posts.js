// pages/api/linkedin-engagement/posts.js
// GET /api/linkedin-engagement/posts            -> list recent posts + engagement counts
// GET /api/linkedin-engagement/posts?postId=X   -> one post + every engager (who liked/commented)
import prisma from "../../../lib/prisma.js";
import { requireAuth } from "../../../lib/auth.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const session = requireAuth(req, res);
  if (!session) return;

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const { postId } = req.query;

    if (postId) {
      const post = await prisma.engagementPost.findUnique({
        where: { id: postId },
        include: {
          engagements: {
            include: { profile: true },
            orderBy: { reactedAt: "desc" },
          },
        },
      });
      if (!post) return res.status(404).json({ error: "Not found" });
      return res.status(200).json(post);
    }

    const posts = await prisma.engagementPost.findMany({
      orderBy: { postedAt: "desc" },
      take: 100,
      include: { _count: { select: { engagements: true } } },
    });

    const withCounts = await Promise.all(
      posts.map(async (post) => {
        const [likeCount, commentCount] = await Promise.all([
          prisma.engagementRecord.count({ where: { postId: post.id, type: { in: ["LIKE", "REACTION_OTHER"] } } }),
          prisma.engagementRecord.count({ where: { postId: post.id, type: "COMMENT" } }),
        ]);
        return { ...post, likeCount, commentCount };
      })
    );

    return res.status(200).json(withCounts);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", message: err?.message });
  }
}
