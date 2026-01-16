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

  // GET - List all FAQs with translations
  if (req.method === "GET") {
    try {
      const { categoryId } = req.query;

      const whereClause = categoryId ? { categoryId: categoryId as string } : {};

      const faqs = await prisma.faq.findMany({
        where: whereClause,
        orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
        include: {
          translations: true,
          category: {
            include: {
              translations: true,
            },
          },
        },
      });

      return res.status(200).json({
        faqs: faqs.map((faq) => ({
          id: faq.id,
          categoryId: faq.categoryId,
          categoryKey: faq.category.key,
          categoryName: faq.category.translations.reduce(
            (acc, t) => {
              acc[t.locale] = t.name;
              return acc;
            },
            {} as Record<string, string>
          ),
          sortOrder: faq.sortOrder,
          isActive: faq.isActive,
          translations: faq.translations.reduce(
            (acc, t) => {
              acc[t.locale] = { question: t.question, answer: t.answer };
              return acc;
            },
            {} as Record<string, { question: string; answer: string }>
          ),
          createdAt: faq.createdAt.toISOString(),
          updatedAt: faq.updatedAt.toISOString(),
        })),
      });
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      return res.status(500).json({ error: "Failed to fetch FAQs" });
    }
  }

  // POST - Create new FAQ
  if (req.method === "POST") {
    try {
      const { categoryId, sortOrder, isActive, translations } = req.body;

      if (!categoryId) {
        return res.status(400).json({ error: "Category ID is required" });
      }

      if (!translations || !translations.en?.question || !translations.en?.answer) {
        return res
          .status(400)
          .json({ error: "English question and answer are required" });
      }

      // Check category exists
      const category = await prisma.faqCategory.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      // Create FAQ with translations
      const faq = await prisma.faq.create({
        data: {
          categoryId,
          sortOrder: sortOrder ?? 0,
          isActive: isActive ?? true,
          translations: {
            create: Object.entries(
              translations as Record<string, { question: string; answer: string }>
            )
              .filter(([, data]) => data.question?.trim() && data.answer?.trim())
              .map(([locale, data]) => ({
                locale,
                question: data.question.trim(),
                answer: data.answer.trim(),
              })),
          },
        },
        include: {
          translations: true,
          category: {
            include: { translations: true },
          },
        },
      });

      // Log to audit
      await logAudit({
        userId: session.user?.id || "unknown",
        userEmail: session.user?.email || "unknown",
        action: "create",
        entity: "faq",
        entityId: faq.id,
      });

      return res.status(200).json({
        success: true,
        faq: {
          id: faq.id,
          categoryId: faq.categoryId,
          categoryKey: faq.category.key,
          categoryName: faq.category.translations.reduce(
            (acc, t) => {
              acc[t.locale] = t.name;
              return acc;
            },
            {} as Record<string, string>
          ),
          sortOrder: faq.sortOrder,
          isActive: faq.isActive,
          translations: faq.translations.reduce(
            (acc, t) => {
              acc[t.locale] = { question: t.question, answer: t.answer };
              return acc;
            },
            {} as Record<string, { question: string; answer: string }>
          ),
          createdAt: faq.createdAt.toISOString(),
          updatedAt: faq.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error("Error creating FAQ:", error);
      return res.status(500).json({ error: "Failed to create FAQ" });
    }
  }

  // PUT - Update FAQ
  if (req.method === "PUT") {
    try {
      const { id, categoryId, sortOrder, isActive, translations } = req.body;

      if (!id) {
        return res.status(400).json({ error: "FAQ ID is required" });
      }

      const currentFaq = await prisma.faq.findUnique({
        where: { id },
        include: { translations: true },
      });

      if (!currentFaq) {
        return res.status(404).json({ error: "FAQ not found" });
      }

      // Check category if changing
      if (categoryId && categoryId !== currentFaq.categoryId) {
        const category = await prisma.faqCategory.findUnique({
          where: { id: categoryId },
        });
        if (!category) {
          return res.status(404).json({ error: "Category not found" });
        }
      }

      // Update FAQ
      await prisma.faq.update({
        where: { id },
        data: {
          categoryId: categoryId ?? currentFaq.categoryId,
          sortOrder: sortOrder ?? currentFaq.sortOrder,
          isActive: isActive ?? currentFaq.isActive,
        },
      });

      // Update translations if provided
      if (translations) {
        // Delete existing translations and recreate
        await prisma.faqTranslation.deleteMany({
          where: { faqId: id },
        });

        await prisma.faqTranslation.createMany({
          data: Object.entries(
            translations as Record<string, { question: string; answer: string }>
          )
            .filter(([, data]) => data.question?.trim() && data.answer?.trim())
            .map(([locale, data]) => ({
              faqId: id,
              locale,
              question: data.question.trim(),
              answer: data.answer.trim(),
            })),
        });
      }

      // Log to audit
      await logAudit({
        userId: session.user?.id || "unknown",
        userEmail: session.user?.email || "unknown",
        action: "update",
        entity: "faq",
        entityId: id,
        changes: {
          isActive: { from: currentFaq.isActive, to: isActive },
          categoryId: { from: currentFaq.categoryId, to: categoryId },
        },
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error updating FAQ:", error);
      return res.status(500).json({ error: "Failed to update FAQ" });
    }
  }

  // DELETE - Delete FAQ
  if (req.method === "DELETE") {
    try {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: "FAQ ID is required" });
      }

      // Delete translations first (cascade should handle this, but being explicit)
      await prisma.faqTranslation.deleteMany({
        where: { faqId: id },
      });

      await prisma.faq.delete({
        where: { id },
      });

      // Log to audit
      await logAudit({
        userId: session.user?.id || "unknown",
        userEmail: session.user?.email || "unknown",
        action: "delete",
        entity: "faq",
        entityId: id,
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      return res.status(500).json({ error: "Failed to delete FAQ" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
