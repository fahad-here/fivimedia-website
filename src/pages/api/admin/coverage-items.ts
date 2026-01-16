import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";

const createSchema = z.object({
  key: z.string().min(1),
  titleEn: z.string().min(1),
  titleAr: z.string().min(1),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  if (req.method === "POST") {
    try {
      const parseResult = createSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          error: "Invalid data: " + parseResult.error.issues.map(i => i.message).join(", "),
        });
      }

      const { key, titleEn, titleAr, descriptionEn, descriptionAr } = parseResult.data;

      // Check if key already exists
      const existing = await prisma.coverageItem.findUnique({ where: { key } });
      if (existing) {
        return res.status(400).json({
          success: false,
          error: "A coverage item with this key already exists",
        });
      }

      // Get max sortOrder
      const maxOrder = await prisma.coverageItem.aggregate({
        _max: { sortOrder: true },
      });
      const sortOrder = (maxOrder._max.sortOrder || 0) + 1;

      // Create coverage item
      const coverageItem = await prisma.coverageItem.create({
        data: {
          key,
          titleEn,
          titleAr,
          descriptionEn: descriptionEn || null,
          descriptionAr: descriptionAr || null,
          sortOrder,
        },
      });

      // Create StateCoverage entries for all states
      const states = await prisma.state.findMany({ select: { id: true } });
      await prisma.stateCoverage.createMany({
        data: states.map((state) => ({
          stateId: state.id,
          coverageItemId: coverageItem.id,
          enabled: true,
          processingTime: null,
        })),
      });

      return res.status(201).json({
        success: true,
        coverageItem: {
          id: coverageItem.id,
          key: coverageItem.key,
          titleEn: coverageItem.titleEn,
          titleAr: coverageItem.titleAr,
          descriptionEn: coverageItem.descriptionEn,
          descriptionAr: coverageItem.descriptionAr,
          sortOrder: coverageItem.sortOrder,
        },
      });
    } catch (error) {
      console.error("Create coverage item error:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
