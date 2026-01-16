import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";

interface StatesResponse {
  success: boolean;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StatesResponse>
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  if (req.method !== "PUT") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { stateCode, coverage, states: stateUpdates } = req.body;

    // Update state isActive status if provided
    if (stateUpdates && Array.isArray(stateUpdates)) {
      for (const update of stateUpdates) {
        await prisma.state.update({
          where: { code: update.code },
          data: { isActive: update.isActive },
        });
      }
    }

    // Update coverage for specific state if provided
    if (stateCode && coverage) {
      // Get state ID
      const state = await prisma.state.findUnique({
        where: { code: stateCode },
      });

      if (!state) {
        return res.status(400).json({ success: false, error: "Invalid state" });
      }

      // Update coverage for each item
      for (const item of coverage) {
        await prisma.stateCoverage.upsert({
          where: {
            stateId_coverageItemId: {
              stateId: state.id,
              coverageItemId: item.coverageItemId,
            },
          },
          update: {
            enabled: item.enabled,
            processingTime: item.processingTime,
          },
          create: {
            stateId: state.id,
            coverageItemId: item.coverageItemId,
            enabled: item.enabled,
            processingTime: item.processingTime,
          },
        });
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("States API error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update",
    });
  }
}
