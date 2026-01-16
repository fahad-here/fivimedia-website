import { useState } from "react";
import { useTranslations } from "next-intl";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "@/components/Layout";
import prisma from "@/lib/prisma";
import { locales } from "@/i18n/config";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface FaqCategory {
  id: string;
  key: string;
  name: string;
  faqs: FaqItem[];
}

interface FaqsPageProps {
  categories: FaqCategory[];
  locale: string;
}

export default function FaqsPage({ categories }: FaqsPageProps) {
  const t = useTranslations("faqs");
  const router = useRouter();
  const locale = router.query.locale as string || "en";
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(
    categories[0]?.id || null
  );

  const toggleFaq = (faqId: string) => {
    setExpandedFaq(expandedFaq === faqId ? null : faqId);
  };

  const currentCategory = categories.find((c) => c.id === activeCategory);

  return (
    <Layout>
      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[var(--foreground)] mb-4">
              {t("title")}
            </h1>
            <p className="text-lg text-[var(--foreground-muted)]">
              {t("subtitle")}
            </p>
          </div>

          {categories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[var(--foreground-muted)]">{t("noFaqs")}</p>
            </div>
          ) : (
            <>
              {/* Category Tabs */}
              {categories.length > 1 && (
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeCategory === category.id
                          ? "bg-[var(--color-primary)] text-white"
                          : "bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)]"
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              )}

              {/* FAQs Accordion */}
              {currentCategory && (
                <div className="space-y-4">
                  {currentCategory.faqs.map((faq) => (
                    <div
                      key={faq.id}
                      className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() => toggleFaq(faq.id)}
                        className="w-full px-6 py-4 text-start flex items-center justify-between gap-4"
                      >
                        <span className="font-medium text-[var(--foreground)]">
                          {faq.question}
                        </span>
                        <motion.span
                          animate={{ rotate: expandedFaq === faq.id ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex-shrink-0"
                        >
                          <svg
                            className="w-5 h-5 text-[var(--foreground-muted)]"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </motion.span>
                      </button>
                      <AnimatePresence>
                        {expandedFaq === faq.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="px-6 pb-4">
                              <div className="pt-2 border-t border-[var(--border)]">
                                <p className="text-[var(--foreground-muted)] whitespace-pre-line pt-4">
                                  {faq.answer}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Contact CTA */}
          <div className="mt-16 text-center p-8 bg-[var(--muted)] rounded-xl">
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
              {t("stillHaveQuestions")}
            </h2>
            <p className="text-[var(--foreground-muted)] mb-4">
              {t("contactUsText")}
            </p>
            <Link
              href={`/${locale}/contact`}
              className="inline-block px-6 py-3 bg-[var(--color-primary)] text-white rounded-lg font-medium hover:bg-[var(--color-primary-dark)] transition-colors"
            >
              {t("contactButton")}
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<FaqsPageProps> = async ({
  params,
}) => {
  const locale = (params?.locale as string) || "en";

  // Validate locale
  if (!(locales as readonly string[]).includes(locale)) {
    return {
      notFound: true,
    };
  }

  try {
    // Fetch active categories with their FAQs
    const categoriesData = await prisma.faqCategory.findMany({
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
    const categories = categoriesData
      .filter((cat) => cat.faqs.length > 0) // Only include categories with FAQs
      .map((category) => {
        // Get category name for locale, fallback to English
        const categoryTranslation =
          category.translations.find((t) => t.locale === locale) ||
          category.translations.find((t) => t.locale === "en");

        return {
          id: category.id,
          key: category.key,
          name: categoryTranslation?.name || category.key,
          faqs: category.faqs.map((faq) => {
            // Get FAQ translation for locale, fallback to English
            const faqTranslation =
              faq.translations.find((t) => t.locale === locale) ||
              faq.translations.find((t) => t.locale === "en");

            return {
              id: faq.id,
              question: faqTranslation?.question || "",
              answer: faqTranslation?.answer || "",
            };
          }),
        };
      });

    return {
      props: {
        categories,
        locale,
        messages: (await import(`@/messages/${locale}.json`)).default,
      },
    };
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    return {
      props: {
        categories: [],
        locale,
        messages: (await import(`@/messages/${locale}.json`)).default,
      },
    };
  }
};
