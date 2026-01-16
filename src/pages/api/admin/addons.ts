import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";

const createSchema = z.object({
  slug: z.string().min(1),
  nameEn: z.string().min(1),
  nameAr: z.string().min(1),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
  price: z.number().min(0),
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

      const { slug, nameEn, nameAr, descriptionEn, descriptionAr, price } = parseResult.data;

      // Check if slug already exists
      const existing = await prisma.addOn.findUnique({ where: { slug } });
      if (existing) {
        return res.status(400).json({
          success: false,
          error: "An add-on with this slug already exists",
        });
      }

      // Get max sortOrder
      const maxOrder = await prisma.addOn.aggregate({
        _max: { sortOrder: true },
      });
      const sortOrder = (maxOrder._max.sortOrder || 0) + 1;

      // Create add-on
      const addOn = await prisma.addOn.create({
        data: {
          slug,
          nameEn,
          nameAr,
          descriptionEn: descriptionEn || null,
          descriptionAr: descriptionAr || null,
          price,
          sortOrder,
          isActive: true,
        },
      });

      return res.status(201).json({
        success: true,
        addOn: {
          id: addOn.id,
          slug: addOn.slug,
          nameEn: addOn.nameEn,
          nameAr: addOn.nameAr,
          descriptionEn: addOn.descriptionEn,
          descriptionAr: addOn.descriptionAr,
          price: addOn.price,
          isActive: addOn.isActive,
        },
      });
    } catch (error) {
      console.error("Create add-on error:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
