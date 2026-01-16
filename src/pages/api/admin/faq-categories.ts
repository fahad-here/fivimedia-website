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

  // GET - List all FAQ categories with translations
  if (req.method === "GET") {
    try {
      const categories = await prisma.faqCategory.findMany({
        orderBy: { sortOrder: "asc" },
        include: {
          translations: true,
          _count: {
            select: { faqs: true },
          },
        },
      });

      return res.status(200).json({
        categories: categories.map((cat) => ({
          id: cat.id,
          key: cat.key,
          sortOrder: cat.sortOrder,
          isActive: cat.isActive,
          faqCount: cat._count.faqs,
          translations: cat.translations.reduce(
            (acc, t) => {
              acc[t.locale] = t.name;
              return acc;
            },
            {} as Record<string, string>
          ),
          createdAt: cat.createdAt.toISOString(),
          updatedAt: cat.updatedAt.toISOString(),
        })),
      });
    } catch (error) {
      console.error("Error fetching FAQ categories:", error);
      return res.status(500).json({ error: "Failed to fetch FAQ categories" });
    }
  }

  // POST - Create new FAQ category
  if (req.method === "POST") {
    try {
      const { key, sortOrder, isActive, translations } = req.body;

      if (!key) {
        return res.status(400).json({ error: "Category key is required" });
      }

      if (!translations || !translations.en) {
        return res.status(400).json({ error: "English translation is required" });
      }

      // Check if key already exists
      const existing = await prisma.faqCategory.findUnique({
        where: { key },
      });

      if (existing) {
        return res.status(400).json({ error: "Category key already exists" });
      }

      // Create category with translations
      const category = await prisma.faqCategory.create({
        data: {
          key,
          sortOrder: sortOrder ?? 0,
          isActive: isActive ?? true,
          translations: {
            create: Object.entries(translations as Record<string, string>)
              .filter(([, name]) => name && name.trim())
              .map(([locale, name]) => ({
                locale,
                name: name.trim(),
              })),
          },
        },
        include: {
          translations: true,
        },
      });

      // Log to audit
      await logAudit({
        userId: session.user?.id || "unknown",
        userEmail: session.user?.email || "unknown",
        action: "create",
        entity: "faq_category",
        entityId: category.id,
      });

      return res.status(200).json({
        success: true,
        category: {
          id: category.id,
          key: category.key,
          sortOrder: category.sortOrder,
          isActive: category.isActive,
          faqCount: 0,
          translations: category.translations.reduce(
            (acc, t) => {
              acc[t.locale] = t.name;
              return acc;
            },
            {} as Record<string, string>
          ),
          createdAt: category.createdAt.toISOString(),
          updatedAt: category.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error("Error creating FAQ category:", error);
      return res.status(500).json({ error: "Failed to create FAQ category" });
    }
  }

  // PUT - Update FAQ category
  if (req.method === "PUT") {
    try {
      const { id, key, sortOrder, isActive, translations } = req.body;

      if (!id) {
        return res.status(400).json({ error: "Category ID is required" });
      }

      const currentCategory = await prisma.faqCategory.findUnique({
        where: { id },
        include: { translations: true },
      });

      if (!currentCategory) {
        return res.status(404).json({ error: "Category not found" });
      }

      // Check for duplicate key if changing
      if (key && key !== currentCategory.key) {
        const existing = await prisma.faqCategory.findUnique({
          where: { key },
        });
        if (existing) {
          return res.status(400).json({ error: "Category key already exists" });
        }
      }

      // Update category
      await prisma.faqCategory.update({
        where: { id },
        data: {
          key: key ?? currentCategory.key,
          sortOrder: sortOrder ?? currentCategory.sortOrder,
          isActive: isActive ?? currentCategory.isActive,
        },
      });

      // Update translations if provided
      if (translations) {
        // Delete existing translations and recreate
        await prisma.faqCategoryTranslation.deleteMany({
          where: { categoryId: id },
        });

        await prisma.faqCategoryTranslation.createMany({
          data: Object.entries(translations as Record<string, string>)
            .filter(([, name]) => name && name.trim())
            .map(([locale, name]) => ({
              categoryId: id,
              locale,
              name: name.trim(),
            })),
        });
      }

      // Log to audit
      await logAudit({
        userId: session.user?.id || "unknown",
        userEmail: session.user?.email || "unknown",
        action: "update",
        entity: "faq_category",
        entityId: id,
        changes: {
          key: { from: currentCategory.key, to: key },
          isActive: { from: currentCategory.isActive, to: isActive },
        },
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error updating FAQ category:", error);
      return res.status(500).json({ error: "Failed to update FAQ category" });
    }
  }

  // DELETE - Delete FAQ category
  if (req.method === "DELETE") {
    try {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: "Category ID is required" });
      }

      // Check if category has FAQs
      const category = await prisma.faqCategory.findUnique({
        where: { id },
        include: { _count: { select: { faqs: true } } },
      });

      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      if (category._count.faqs > 0) {
        return res.status(400).json({
          error: "Cannot delete category with FAQs. Delete FAQs first.",
        });
      }

      // Delete translations first (cascade should handle this, but being explicit)
      await prisma.faqCategoryTranslation.deleteMany({
        where: { categoryId: id },
      });

      await prisma.faqCategory.delete({
        where: { id },
      });

      // Log to audit
      await logAudit({
        userId: session.user?.id || "unknown",
        userEmail: session.user?.email || "unknown",
        action: "delete",
        entity: "faq_category",
        entityId: id,
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting FAQ category:", error);
      return res.status(500).json({ error: "Failed to delete FAQ category" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
