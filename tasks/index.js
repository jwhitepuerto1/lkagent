// pages/api/tasks/index.js
import prisma from "../../../lib/prisma.js";

function parseBool(v, defaultVal) {
  if (v === undefined) return defaultVal;
  return String(v).toLowerCase() === "true";
}

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res.status(405).json({ error: "Method not allowed" });
    }

    const {
      search = "",
      stage = "All",
      owner = "All",
      priority = "All",
      activeOnly,
      hideWithoutNextAction,
      dueOnly,
    } = req.query;

    const activeOnlyBool = parseBool(activeOnly, true);
    const hideWithoutNextActionBool = parseBool(hideWithoutNextAction, true);
    const dueOnlyBool = parseBool(dueOnly, false);

    const now = new Date();
    const endToday = new Date(now);
    endToday.setHours(23, 59, 59, 999);

    const where = {};

    if (activeOnlyBool) where.status = "Active";
    if (stage && stage !== "All") where.stage = stage;
    if (owner && owner !== "All") where.owner = owner;
    if (priority && priority !== "All") where.priority = priority;

    if (hideWithoutNextActionBool) {
      where.nextActionAt = { not: null };
    }

    if (dueOnlyBool) {
      where.nextActionAt = { ...(where.nextActionAt || {}), lte: endToday };
    }

    const s = String(search || "").trim();
    if (s) {
      where.OR = [
        { id: { contains: s, mode: "insensitive" } },
        { name: { contains: s, mode: "insensitive" } },
        { segment: { contains: s, mode: "insensitive" } },
        { owner: { contains: s, mode: "insensitive" } },
      ];
    }

    const leads = await prisma.lead.findMany({
      where,
      orderBy: [{ nextActionAt: "asc" }, { id: "asc" }],
      select: {
        id: true,
        name: true,
        segment: true,
        stage: true,
        status: true,
        owner: true,
        priority: true,
        nextActionAt: true,
        lastTouch: true,
      },
    });

    const dueNow = [];
    const upcoming = [];

    for (const l of leads) {
      if (!l.nextActionAt) continue;
      if (new Date(l.nextActionAt) <= endToday) dueNow.push(l);
      else upcoming.push(l);
    }

    return res.status(200).json({
      dueNow,
      upcoming,
      counts: { due: dueNow.length, upcoming: upcoming.length },
      serverNow: now.toISOString(),
      endOfToday: endToday.toISOString(),
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal Server Error", message: e?.message });
  }
}
