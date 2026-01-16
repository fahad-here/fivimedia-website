import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    try {
      const {
        entity,
        userId,
        page = "1",
        limit = "50",
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      // Build where clause
      const where: {
        entity?: string;
        userId?: string;
      } = {};

      if (entity && entity !== "all") {
        where.entity = entity as string;
      }

      if (userId) {
        where.userId = userId as string;
      }

      // Get total count for pagination
      const totalCount = await prisma.auditLog.count({ where });

      // Get audit logs
      const logs = await prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      });

      return res.status(200).json({
        logs: logs.map((log) => ({
          ...log,
          createdAt: log.createdAt.toISOString(),
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalCount,
          totalPages: Math.ceil(totalCount / limitNum),
        },
      });
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      return res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
