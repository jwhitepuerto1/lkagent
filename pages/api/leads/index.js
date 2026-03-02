// pages/api/leads/index.js
import crypto from "crypto";
import prisma from "../../../lib/prisma.js";
import { requireAuth } from "../../../lib/auth.js";

function makeLeadId() {
  return `L-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

function q1(v) {
  if (Array.isArray(v)) return v[0];
  return v;
}

function toInt(v, fallback) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

function buildOrderBy(sortRaw) {
  const sort = (sortRaw || "").toLowerCase();
  // keep it conservative to avoid Prisma injection-like mistakes
  if (sort === "id_desc") return { id: "desc" };
  return { id: "asc" }; // default + current behavior
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  // 🔒 Auth gate
  const session = requireAuth(req, res);
  if (!session) return;

  try {
    if (req.method === "GET") {
      const v = q1(req.query?.v);
      const isV2 = v === "2" || v === "v2";

      // ✅ Backward compatible (existing UI expects an array)
      if (!isV2) {
        const leads = await prisma.lead.findMany({
          orderBy: { id: "asc" },
        });
        return res.status(200).json(leads);
      }

      // ---- V2 (paginated + searchable + filterable) ----
      const page = Math.max(1, toInt(q1(req.query?.page), 1));
      const pageSize = Math.min(100, Math.max(1, toInt(q1(req.query?.pageSize), 25)));
      const q = (q1(req.query?.q) || "").trim();

      const status = (q1(req.query?.status) || "").trim();
      const stage = (q1(req.query?.stage) || "").trim();
      const owner = (q1(req.query?.owner) || "").trim();

      const sort = q1(req.query?.sort);

      const and = [];
      if (status) and.push({ status });
      if (stage) and.push({ stage });
      if (owner) and.push({ owner });

      if (q) {
        and.push({
          OR: [
            { id: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        });
      }

      const where = and.length ? { AND: and } : undefined;

      const total = await prisma.lead.count({ where });

      const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
      const safePage = totalPages === 0 ? 1 : Math.min(page, totalPages);

      const data = await prisma.lead.findMany({
        where,
        orderBy: buildOrderBy(sort),
        skip: (safePage - 1) * pageSize,
        take: pageSize,
      });

      return res.status(200).json({
        data,
        pageInfo: {
          page: safePage,
          pageSize,
          total,
          totalPages,
        },
      });
    }

    if (req.method === "POST") {
      const body = req.body || {};
      const name = (body.name || "").trim();
      if (!name) return res.status(400).json({ error: "name is required" });

      const id = (body.id || "").trim() || makeLeadId();

      const lead = await prisma.lead.create({
        data: {
          id,
          name,
          segment: (body.segment || "Developer").trim(),
          stage: body.stage || "Prospect",
          status: body.status || "Active",
          owner: (body.owner || "John").trim(),
          priority: body.priority || "Medium",
          nextActionAt: body.nextActionAt ? new Date(body.nextActionAt) : null,
          lastTouch: body.lastTouch ? new Date(body.lastTouch) : null,
        },
      });

      return res.status(201).json(lead);
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: err?.message,
    });
  }
}