import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { locale = "en" } = req.query;
    const localeStr = Array.isArray(locale) ? locale[0] : locale;

    // Fetch active categories with their FAQs
    const categories = await prisma.faqCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        translations: true,
        faqs: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          include: {
            translations: true,
          },
        },
      },
    });

    // Transform data for the specified locale with fallback to English
    const result = categories
      .filter((cat) => cat.faqs.length > 0) // Only include categories with FAQs
      .map((category) => {
        // Get category name for locale, fallback to English
        const categoryTranslation =
          category.translations.find((t) => t.locale === localeStr) ||
          category.translations.find((t) => t.locale === "en");

        return {
          id: category.id,
          key: category.key,
          name: categoryTranslation?.name || category.key,
          faqs: category.faqs.map((faq) => {
            // Get FAQ translation for locale, fallback to English
            const faqTranslation =
              faq.translations.find((t) => t.locale === localeStr) ||
              faq.translations.find((t) => t.locale === "en");

            return {
              id: faq.id,
              question: faqTranslation?.question || "",
              answer: faqTranslation?.answer || "",
            };
          }),
        };
      });

    return res.status(200).json({ categories: result });
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    return res.status(500).json({ error: "Failed to fetch FAQs" });
  }
}
