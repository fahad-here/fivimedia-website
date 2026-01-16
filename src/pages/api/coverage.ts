import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

interface CoverageItemResponse {
  key: string;
  title: string;
  description: string | null;
  processingTime: string | null;
}

interface CoverageResponse {
  success: boolean;
  stateCode?: string;
  stateName?: string;
  basePrice?: number;
  coverage?: CoverageItemResponse[];
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CoverageResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { stateCode, locale = "en" } = req.query;

  if (!stateCode || typeof stateCode !== "string") {
    return res.status(400).json({
      success: false,
      error: "State code is required",
    });
  }

  try {
    // Fetch state with coverage items
    const state = await prisma.state.findUnique({
      where: { code: stateCode.toUpperCase() },
      include: {
        stateCoverage: {
          where: { enabled: true },
          include: {
            coverageItem: true,
          },
          orderBy: {
            coverageItem: {
              sortOrder: "asc",
            },
          },
        },
      },
    });

    if (!state) {
      return res.status(404).json({
        success: false,
        error: "State not found",
      });
    }

    // Map coverage items with localized content
    const isArabic = locale === "ar";
    const coverage: CoverageItemResponse[] = state.stateCoverage.map((sc) => ({
      key: sc.coverageItem.key,
      title: isArabic ? sc.coverageItem.titleAr : sc.coverageItem.titleEn,
      description: isArabic
        ? sc.coverageItem.descriptionAr
        : sc.coverageItem.descriptionEn,
      processingTime: sc.processingTime,
    }));

    return res.status(200).json({
      success: true,
      stateCode: state.code,
      stateName: state.name,
      basePrice: state.basePrice,
      coverage,
    });
  } catch (error) {
    console.error("Coverage API error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}
