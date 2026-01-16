import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { authOptions } from "../../api/auth/[...nextauth]";
import prisma from "@/lib/prisma";

interface Language {
  code: string;
  name: string;
  direction: string;
}

interface FaqCategory {
  id: string;
  key: string;
  translations: Record<string, string>;
}

interface Faq {
  id: string;
  categoryId: string;
  categoryKey: string;
  categoryName: Record<string, string>;
  sortOrder: number;
  isActive: boolean;
  translations: Record<string, { question: string; answer: string }>;
  createdAt: string;
  updatedAt: string;
}

interface FaqsPageProps {
  faqs: Faq[];
  categories: FaqCategory[];
  languages: Language[];
}

export default function FaqsPage({
  faqs: initialFaqs,
  categories,
  languages,
}: FaqsPageProps) {
  const [faqs, setFaqs] = useState(initialFaqs);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [formError, setFormError] = useState("");
  const formRef = useRef<HTMLDivElement>(null);

  // Form state
  const [formData, setFormData] = useState<{
    categoryId: string;
    sortOrder: number;
    isActive: boolean;
    translations: Record<string, { question: string; answer: string }>;
  }>(() => {
    const translations: Record<string, { question: string; answer: string }> = {};
    languages.forEach((lang) => {
      translations[lang.code] = { question: "", answer: "" };
    });
    return {
      categoryId: categories[0]?.id || "",
      sortOrder: 0,
      isActive: true,
      translations,
    };
  });

  useEffect(() => {
    if ((showForm || editingFaq) && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showForm, editingFaq]);

  const resetForm = () => {
    const translations: Record<string, { question: string; answer: string }> = {};
    languages.forEach((lang) => {
      translations[lang.code] = { question: "", answer: "" };
    });
    setFormData({
      categoryId: categories[0]?.id || "",
      sortOrder: 0,
      isActive: true,
      translations,
    });
    setEditingFaq(null);
    setShowForm(false);
    setFormError("");
  };

  const handleEdit = (faq: Faq) => {
    // Fill in missing language translations
    const translations: Record<string, { question: string; answer: string }> = {};
    languages.forEach((lang) => {
      translations[lang.code] = faq.translations[lang.code] || {
        question: "",
        answer: "",
      };
    });

    setFormData({
      categoryId: faq.categoryId,
      sortOrder: faq.sortOrder,
      isActive: faq.isActive,
      translations,
    });
    setEditingFaq(faq);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.categoryId) {
      setFormError("Category is required");
      return;
    }

    if (
      !formData.translations.en?.question ||
      !formData.translations.en?.answer
    ) {
      setFormError("English question and answer are required");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const url = "/api/admin/faqs";
      const method = editingFaq ? "PUT" : "POST";
      const body = editingFaq ? { id: editingFaq.id, ...formData } : formData;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        if (editingFaq) {
          // Update in list
          const category = categories.find((c) => c.id === formData.categoryId);
          setFaqs((prev) =>
            prev.map((f) =>
              f.id === editingFaq.id
                ? {
                    ...f,
                    categoryId: formData.categoryId,
                    categoryKey: category?.key || "",
                    categoryName: category?.translations || {},
                    sortOrder: formData.sortOrder,
                    isActive: formData.isActive,
                    translations: formData.translations,
                  }
                : f
            )
          );
          setMessage({ text: "FAQ updated successfully", type: "success" });
        } else {
          // Add new
          setFaqs((prev) => [...prev, data.faq]);
          setMessage({ text: "FAQ created successfully", type: "success" });
        }
        resetForm();
      } else {
        setFormError(data.error || "Failed to save FAQ");
      }
    } catch {
      setFormError("Failed to save FAQ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (faq: Faq) => {
    if (
      !confirm(
        `Are you sure you want to delete "${faq.translations.en?.question || "this FAQ"}"?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/admin/faqs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: faq.id }),
      });

      const data = await response.json();

      if (data.success) {
        setFaqs((prev) => prev.filter((f) => f.id !== faq.id));
        setMessage({ text: "FAQ deleted", type: "success" });
      } else {
        setMessage({ text: data.error || "Failed to delete", type: "error" });
      }
    } catch {
      setMessage({ text: "Failed to delete FAQ", type: "error" });
    }
  };

  const handleToggleActive = async (faq: Faq) => {
    try {
      const response = await fetch("/api/admin/faqs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: faq.id, isActive: !faq.isActive }),
      });

      const data = await response.json();

      if (data.success) {
        setFaqs((prev) =>
          prev.map((f) =>
            f.id === faq.id ? { ...f, isActive: !f.isActive } : f
          )
        );
      } else {
        setMessage({ text: data.error || "Failed to update", type: "error" });
      }
    } catch {
      setMessage({ text: "Failed to update FAQ", type: "error" });
    }
  };

  // Filter FAQs by category
  const filteredFaqs =
    categoryFilter === "all"
      ? faqs
      : faqs.filter((f) => f.categoryId === categoryFilter);

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">FAQs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage frequently asked questions
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/faqs/categories"
            className="px-4 py-2 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors"
          >
            Manage Categories
          </Link>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            disabled={categories.length === 0}
            className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            + Add FAQ
          </button>
        </div>
      </div>

      {message.text && (
        <div
          className={`mb-6 p-4 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-success/10 text-success"
              : "bg-error/10 text-error"
          }`}
        >
          {message.text}
        </div>
      )}

      {categories.length === 0 && (
        <div className="bg-warning/10 text-warning p-4 rounded-lg mb-6">
          No FAQ categories exist. Please{" "}
          <Link href="/admin/faqs/categories" className="underline font-medium">
            create categories
          </Link>{" "}
          first.
        </div>
      )}

      {/* Form */}
      {showForm && categories.length > 0 && (
        <div
          ref={formRef}
          className="bg-card rounded-xl border border-border p-6 mb-6"
        >
          <h2 className="text-lg font-semibold mb-4">
            {editingFaq ? "Edit FAQ" : "New FAQ"}
          </h2>

          {formError && (
            <div className="mb-4 p-3 bg-error/10 text-error rounded-lg text-sm">
              {formError}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Category <span className="text-error">*</span>
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) =>
                  setFormData({ ...formData, categoryId: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.translations.en || cat.key}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sort Order</label>
              <input
                type="number"
                value={formData.sortOrder}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sortOrder: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Dynamic language fields */}
          {languages.map((lang) => (
            <div
              key={lang.code}
              className="mb-6 p-4 bg-muted/50 rounded-lg"
            >
              <h3 className="font-medium mb-3">
                {lang.name}{" "}
                {lang.code === "en" && (
                  <span className="text-error text-sm">* Required</span>
                )}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Question
                  </label>
                  <input
                    type="text"
                    dir={lang.direction === "rtl" ? "rtl" : "ltr"}
                    placeholder={
                      lang.direction === "rtl"
                        ? "السؤال"
                        : `Question in ${lang.name}`
                    }
                    value={formData.translations[lang.code]?.question || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        translations: {
                          ...formData.translations,
                          [lang.code]: {
                            ...formData.translations[lang.code],
                            question: e.target.value,
                          },
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Answer</label>
                  <textarea
                    dir={lang.direction === "rtl" ? "rtl" : "ltr"}
                    rows={4}
                    placeholder={
                      lang.direction === "rtl"
                        ? "الإجابة"
                        : `Answer in ${lang.name}`
                    }
                    value={formData.translations[lang.code]?.answer || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        translations: {
                          ...formData.translations,
                          [lang.code]: {
                            ...formData.translations[lang.code],
                            answer: e.target.value,
                          },
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="isActive" className="text-sm font-medium">
                Active
              </label>
            </div>

            <div className="flex-1" />

            <button
              onClick={resetForm}
              className="px-4 py-2 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : editingFaq ? "Update" : "Create"}
            </button>
          </div>
        </div>
      )}

      {/* Filter */}
      {categories.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-4 mb-6">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Filter by Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.translations.en || cat.key}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-sm text-muted-foreground self-end pb-2">
              {filteredFaqs.length} FAQ{filteredFaqs.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      )}

      {/* FAQs List */}
      <div className="bg-card rounded-xl border border-border">
        <div className="divide-y divide-border">
          {filteredFaqs.length === 0 ? (
            <div className="px-6 py-8 text-center text-muted-foreground">
              {faqs.length === 0
                ? "No FAQs yet. Create one to get started."
                : "No FAQs match your filter."}
            </div>
          ) : (
            filteredFaqs.map((faq) => (
              <div key={faq.id} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-muted rounded text-xs font-medium">
                        {faq.categoryName.en || faq.categoryKey}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Order: {faq.sortOrder}
                      </span>
                      <button
                        onClick={() => handleToggleActive(faq)}
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          faq.isActive
                            ? "bg-success/20 text-success"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {faq.isActive ? "Active" : "Inactive"}
                      </button>
                    </div>
                    <h3 className="font-medium mb-1">
                      {faq.translations.en?.question || "No question"}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {faq.translations.en?.answer || "No answer"}
                    </p>
                    {faq.translations.ar?.question && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <p
                          className="text-sm text-muted-foreground"
                          dir="rtl"
                        >
                          {faq.translations.ar.question}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(faq)}
                      className="text-primary text-sm hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(faq)}
                      className="text-error text-sm hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps<FaqsPageProps> = async (
  context
) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: "/admin/login",
        permanent: false,
      },
    };
  }

  try {
    const [faqs, categories, languages] = await Promise.all([
      prisma.faq.findMany({
        orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
        include: {
          translations: true,
          category: {
            include: { translations: true },
          },
        },
      }),
      prisma.faqCategory.findMany({
        orderBy: { sortOrder: "asc" },
        include: { translations: true },
      }),
      prisma.language.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: { code: true, name: true, direction: true },
      }),
    ]);

    // Fallback to default languages if none configured
    const activeLanguages =
      languages.length > 0
        ? languages
        : [
            { code: "en", name: "English", direction: "ltr" },
            { code: "ar", name: "العربية", direction: "rtl" },
          ];

    return {
      props: {
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
        categories: categories.map((cat) => ({
          id: cat.id,
          key: cat.key,
          translations: cat.translations.reduce(
            (acc, t) => {
              acc[t.locale] = t.name;
              return acc;
            },
            {} as Record<string, string>
          ),
        })),
        languages: activeLanguages,
      },
    };
  } catch (error) {
    console.error("FAQs error:", error);
    return {
      props: {
        faqs: [],
        categories: [],
        languages: [
          { code: "en", name: "English", direction: "ltr" },
          { code: "ar", name: "العربية", direction: "rtl" },
        ],
      },
    };
  }
};
