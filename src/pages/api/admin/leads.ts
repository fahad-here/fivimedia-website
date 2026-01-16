import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // GET - List all leads with optional filters
  if (req.method === "GET") {
    try {
      const { status, search, page = "1", limit = "25" } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      // Build where clause
      const where: {
        status?: string;
        OR?: Array<{ name?: { contains: string }; email?: { contains: string } }>;
      } = {};

      if (status && status !== "all") {
        where.status = status as string;
      }

      if (search) {
        where.OR = [
          { name: { contains: search as string } },
          { email: { contains: search as string } },
        ];
      }

      const [leads, totalCount] = await Promise.all([
        prisma.contactSubmission.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limitNum,
        }),
        prisma.contactSubmission.count({ where }),
      ]);

      return res.status(200).json({
        leads: leads.map((lead) => ({
          ...lead,
          createdAt: lead.createdAt.toISOString(),
          updatedAt: lead.updatedAt.toISOString(),
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalCount,
          totalPages: Math.ceil(totalCount / limitNum),
        },
      });
    } catch (error) {
      console.error("Error fetching leads:", error);
      return res.status(500).json({ error: "Failed to fetch leads" });
    }
  }

  // PUT - Update lead status or notes
  if (req.method === "PUT") {
    try {
      const { id, status, notes } = req.body;

      if (!id) {
        return res.status(400).json({ error: "Lead ID is required" });
      }

      // Get current lead for audit
      const currentLead = await prisma.contactSubmission.findUnique({
        where: { id },
        select: { status: true, notes: true },
      });

      if (!currentLead) {
        return res.status(404).json({ error: "Lead not found" });
      }

      const updateData: { status?: string; notes?: string } = {};
      const changes: Record<string, { from: unknown; to: unknown }> = {};

      if (status !== undefined && status !== currentLead.status) {
        const validStatuses = ["new", "contacted", "closed"];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({ error: "Invalid status" });
        }
        updateData.status = status;
        changes.status = { from: currentLead.status, to: status };
      }

      if (notes !== undefined && notes !== currentLead.notes) {
        updateData.notes = notes;
        changes.notes = { from: currentLead.notes, to: notes };
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.contactSubmission.update({
          where: { id },
          data: updateData,
        });

        // Log to audit
        await logAudit({
          userId: session.user?.id || "unknown",
          userEmail: session.user?.email || "unknown",
          action: "update",
          entity: "lead",
          entityId: id,
          changes: Object.keys(changes).length > 0 ? changes : undefined,
        });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error updating lead:", error);
      return res.status(500).json({ error: "Failed to update lead" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
