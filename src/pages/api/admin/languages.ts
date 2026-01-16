import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  // POST - Create new language
  if (req.method === "POST") {
    try {
      const { code, name, direction } = req.body;

      if (!code || !name) {
        return res.status(400).json({
          success: false,
          error: "Code and name are required",
        });
      }

      // Check if code already exists
      const existing = await prisma.language.findUnique({
        where: { code: code.toLowerCase() },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          error: "Language code already exists",
        });
      }

      // Get max sort order
      const maxSort = await prisma.language.aggregate({
        _max: { sortOrder: true },
      });

      const language = await prisma.language.create({
        data: {
          code: code.toLowerCase(),
          name,
          direction: direction || "ltr",
          sortOrder: (maxSort._max.sortOrder || 0) + 1,
        },
        select: {
          id: true,
          code: true,
          name: true,
          direction: true,
          isDefault: true,
          isActive: true,
          sortOrder: true,
        },
      });

      return res.status(201).json({ success: true, language });
    } catch (error) {
      console.error("Language create error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to create language",
      });
    }
  }

  // PUT - Update languages
  if (req.method === "PUT") {
    try {
      const { languages } = req.body;

      if (!languages || !Array.isArray(languages)) {
        return res.status(400).json({
          success: false,
          error: "Languages array is required",
        });
      }

      // Validate at least one active and one default
      const hasActive = languages.some((l: { isActive: boolean }) => l.isActive);
      const hasDefault = languages.some((l: { isDefault: boolean }) => l.isDefault);
      const defaultCount = languages.filter((l: { isDefault: boolean }) => l.isDefault).length;

      if (!hasActive) {
        return res.status(400).json({
          success: false,
          error: "At least one language must be active",
        });
      }

      if (!hasDefault) {
        return res.status(400).json({
          success: false,
          error: "One language must be set as default",
        });
      }

      if (defaultCount > 1) {
        return res.status(400).json({
          success: false,
          error: "Only one language can be default",
        });
      }

      // Update each language
      for (const lang of languages) {
        await prisma.language.update({
          where: { id: lang.id },
          data: {
            name: lang.name,
            direction: lang.direction,
            isDefault: lang.isDefault,
            isActive: lang.isActive,
            sortOrder: lang.sortOrder,
          },
        });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Languages update error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to update languages",
      });
    }
  }

  // GET - Get all active languages (for public use)
  if (req.method === "GET") {
    try {
      const languages = await prisma.language.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: {
          code: true,
          name: true,
          direction: true,
          isDefault: true,
        },
      });

      return res.status(200).json({ success: true, languages });
    } catch (error) {
      console.error("Languages fetch error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch languages",
      });
    }
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
