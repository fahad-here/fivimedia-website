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

  // GET - List all promo codes
  if (req.method === "GET") {
    try {
      const promoCodes = await prisma.promoCode.findMany({
        orderBy: { createdAt: "desc" },
      });

      return res.status(200).json({
        promoCodes: promoCodes.map((code) => ({
          ...code,
          expiresAt: code.expiresAt?.toISOString() || null,
          createdAt: code.createdAt.toISOString(),
          updatedAt: code.updatedAt.toISOString(),
        })),
      });
    } catch (error) {
      console.error("Error fetching promo codes:", error);
      return res.status(500).json({ error: "Failed to fetch promo codes" });
    }
  }

  // POST - Create new promo code
  if (req.method === "POST") {
    try {
      const { code, type, value, usageLimit, minOrderAmount, expiresAt, isActive } = req.body;

      if (!code || !type || value === undefined) {
        return res.status(400).json({ error: "Code, type, and value are required" });
      }

      if (!["percentage", "fixed"].includes(type)) {
        return res.status(400).json({ error: "Type must be 'percentage' or 'fixed'" });
      }

      if (type === "percentage" && (value < 0 || value > 100)) {
        return res.status(400).json({ error: "Percentage must be between 0 and 100" });
      }

      // Check if code already exists
      const existing = await prisma.promoCode.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (existing) {
        return res.status(400).json({ error: "Promo code already exists" });
      }

      const promoCode = await prisma.promoCode.create({
        data: {
          code: code.toUpperCase(),
          type,
          value,
          usageLimit: usageLimit || null,
          minOrderAmount: minOrderAmount || null,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          isActive: isActive ?? true,
        },
      });

      // Log to audit
      await logAudit({
        userId: session.user?.id || "unknown",
        userEmail: session.user?.email || "unknown",
        action: "create",
        entity: "promo_code",
        entityId: promoCode.id,
      });

      return res.status(200).json({
        success: true,
        promoCode: {
          ...promoCode,
          expiresAt: promoCode.expiresAt?.toISOString() || null,
          createdAt: promoCode.createdAt.toISOString(),
          updatedAt: promoCode.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error("Error creating promo code:", error);
      return res.status(500).json({ error: "Failed to create promo code" });
    }
  }

  // PUT - Update promo code
  if (req.method === "PUT") {
    try {
      const { id, code, type, value, usageLimit, minOrderAmount, expiresAt, isActive } = req.body;

      if (!id) {
        return res.status(400).json({ error: "Promo code ID is required" });
      }

      const currentCode = await prisma.promoCode.findUnique({
        where: { id },
      });

      if (!currentCode) {
        return res.status(404).json({ error: "Promo code not found" });
      }

      // Check for duplicate code if changing
      if (code && code.toUpperCase() !== currentCode.code) {
        const existing = await prisma.promoCode.findUnique({
          where: { code: code.toUpperCase() },
        });
        if (existing) {
          return res.status(400).json({ error: "Promo code already exists" });
        }
      }

      const updateData: {
        code?: string;
        type?: string;
        value?: number;
        usageLimit?: number | null;
        minOrderAmount?: number | null;
        expiresAt?: Date | null;
        isActive?: boolean;
      } = {};

      if (code !== undefined) updateData.code = code.toUpperCase();
      if (type !== undefined) updateData.type = type;
      if (value !== undefined) updateData.value = value;
      if (usageLimit !== undefined) updateData.usageLimit = usageLimit || null;
      if (minOrderAmount !== undefined) updateData.minOrderAmount = minOrderAmount || null;
      if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
      if (isActive !== undefined) updateData.isActive = isActive;

      await prisma.promoCode.update({
        where: { id },
        data: updateData,
      });

      // Log to audit
      await logAudit({
        userId: session.user?.id || "unknown",
        userEmail: session.user?.email || "unknown",
        action: "update",
        entity: "promo_code",
        entityId: id,
        changes: { isActive: { from: currentCode.isActive, to: isActive } },
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error updating promo code:", error);
      return res.status(500).json({ error: "Failed to update promo code" });
    }
  }

  // DELETE - Delete promo code
  if (req.method === "DELETE") {
    try {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: "Promo code ID is required" });
      }

      await prisma.promoCode.delete({
        where: { id },
      });

      // Log to audit
      await logAudit({
        userId: session.user?.id || "unknown",
        userEmail: session.user?.email || "unknown",
        action: "delete",
        entity: "promo_code",
        entityId: id,
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting promo code:", error);
      return res.status(500).json({ error: "Failed to delete promo code" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
