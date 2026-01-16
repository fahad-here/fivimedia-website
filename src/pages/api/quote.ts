import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import prisma from "@/lib/prisma";

// Validation schema for quote request
const quoteRequestSchema = z.object({
  stateCode: z.string().length(2),
  addOnSlugs: z.array(z.string()).default([]),
});

interface AddOnData {
  slug: string;
  name: string;
  description: string;
  price: number;
}

interface QuoteResponse {
  success: boolean;
  stateCode?: string;
  stateName?: string;
  basePrice?: number;
  selectedAddOns?: AddOnData[];
  availableAddOns?: AddOnData[];
  addOnTotal?: number;
  total?: number;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<QuoteResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    // Validate request body
    const parseResult = quoteRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid request: " + parseResult.error.message,
      });
    }

    const { stateCode, addOnSlugs } = parseResult.data;

    // Fetch state from database
    const state = await prisma.state.findUnique({
      where: { code: stateCode },
    });

    if (!state) {
      return res.status(404).json({
        success: false,
        error: "State not found",
      });
    }

    // Fetch all available add-ons
    const allAddOns = await prisma.addOn.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        slug: true,
        nameEn: true,
        descriptionEn: true,
        price: true,
      },
    });

    // Filter selected add-ons
    const selectedAddOns = allAddOns.filter((addon) =>
      addOnSlugs.includes(addon.slug)
    );

    // Calculate totals (SERVER-AUTHORITATIVE)
    const basePrice = state.basePrice;
    const addOnTotal = selectedAddOns.reduce((sum, addon) => sum + addon.price, 0);
    const total = basePrice + addOnTotal;

    return res.status(200).json({
      success: true,
      stateCode: state.code,
      stateName: state.name,
      basePrice,
      selectedAddOns: selectedAddOns.map((addon) => ({
        slug: addon.slug,
        name: addon.nameEn,
        description: addon.descriptionEn || "",
        price: addon.price,
      })),
      availableAddOns: allAddOns.map((addon) => ({
        slug: addon.slug,
        name: addon.nameEn,
        description: addon.descriptionEn || "",
        price: addon.price,
      })),
      addOnTotal,
      total,
    });
  } catch (error) {
    console.error("Quote API error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}
