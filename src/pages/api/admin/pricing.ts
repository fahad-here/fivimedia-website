import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";

interface PricingResponse {
  success: boolean;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PricingResponse>
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  if (req.method !== "PUT") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { states, addOns } = req.body;

    // Update state prices
    for (const state of states) {
      await prisma.state.update({
        where: { code: state.code },
        data: { basePrice: state.basePrice },
      });
    }

    // Update add-ons (price, names, and active status)
    for (const addOn of addOns) {
      await prisma.addOn.update({
        where: { slug: addOn.slug },
        data: {
          price: addOn.price,
          nameEn: addOn.nameEn,
          nameAr: addOn.nameAr,
          isActive: addOn.isActive,
        },
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Pricing API error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update pricing",
    });
  }
}
