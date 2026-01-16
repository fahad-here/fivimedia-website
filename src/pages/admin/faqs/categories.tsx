import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
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
  sortOrder: number;
  isActive: boolean;
  faqCount: number;
  translations: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

interface FaqCategoriesPageProps {
  categories: FaqCategory[];
  languages: Language[];
}

export default function FaqCategoriesPage({
  categories: initialCategories,
  languages,
}: FaqCategoriesPageProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FaqCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [formError, setFormError] = useState("");
  const formRef = useRef<HTMLDivElement>(null);

  // Form state
  const [formData, setFormData] = useState<{
    key: string;
    sortOrder: number;
    isActive: boolean;
    translations: Record<string, string>;
  }>(() => {
    const translations: Record<string, string> = {};
    languages.forEach((lang) => {
      translations[lang.code] = "";
    });
    return { key: "", sortOrder: 0, isActive: true, translations };
  });

  useEffect(() => {
    if ((showForm || editingCategory) && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [showForm, editingCategory]);

  const resetForm = () => {
    const translations: Record<string, string> = {};
    languages.forEach((lang) => {
      translations[lang.code] = "";
    });
    setFormData({ key: "", sortOrder: 0, isActive: true, translations });
    setEditingCategory(null);
    setShowForm(false);
    setFormError("");
  };

  const handleEdit = (category: FaqCategory) => {
    setFormData({
      key: category.key,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      translations: { ...category.translations },
    });
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.key) {
      setFormError("Category key is required");
      return;
    }

    if (!formData.translations.en) {
      setFormError("English name is required");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const url = "/api/admin/faq-categories";
      const method = editingCategory ? "PUT" : "POST";
      const body = editingCategory
        ? { id: editingCategory.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        if (editingCategory) {
          // Update in list
          setCategories((prev) =>
            prev.map((cat) =>
              cat.id === editingCategory.id
                ? {
                    ...cat,
                    key: formData.key,
                    sortOrder: formData.sortOrder,
                    isActive: formData.isActive,
                    translations: formData.translations,
                  }
                : cat
            )
          );
          setMessage({ text: "Category updated successfully", type: "success" });
        } else {
          // Add new
          setCategories((prev) => [...prev, data.category]);
          setMessage({ text: "Category created successfully", type: "success" });
        }
        resetForm();
      } else {
        setFormError(data.error || "Failed to save category");
      }
    } catch {
      setFormError("Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category: FaqCategory) => {
    if (category.faqCount > 0) {
      setMessage({
        text: "Cannot delete category with FAQs. Delete FAQs first.",
        type: "error",
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete "${category.translations.en || category.key}"?`)) {
      return;
    }

    try {
      const response = await fetch("/api/admin/faq-categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: category.id }),
      });

      const data = await response.json();

      if (data.success) {
        setCategories((prev) => prev.filter((c) => c.id !== category.id));
        setMessage({ text: "Category deleted", type: "success" });
      } else {
        setMessage({ text: data.error || "Failed to delete", type: "error" });
      }
    } catch {
      setMessage({ text: "Failed to delete category", type: "error" });
    }
  };

  const handleToggleActive = async (category: FaqCategory) => {
    try {
      const response = await fetch("/api/admin/faq-categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: category.id, isActive: !category.isActive }),
      });

      const data = await response.json();

      if (data.success) {
        setCategories((prev) =>
          prev.map((c) =>
            c.id === category.id ? { ...c, isActive: !c.isActive } : c
          )
        );
      } else {
        setMessage({ text: data.error || "Failed to update", type: "error" });
      }
    } catch {
      setMessage({ text: "Failed to update category", type: "error" });
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">FAQ Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage FAQ categories for organizing questions
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
        >
          + Add Category
        </button>
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

      {/* Form */}
      {showForm && (
        <div ref={formRef} className="bg-card rounded-xl border border-border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingCategory ? "Edit Category" : "New Category"}
          </h2>

          {formError && (
            <div className="mb-4 p-3 bg-error/10 text-error rounded-lg text-sm">
              {formError}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Key (identifier) <span className="text-error">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., general, pricing, process"
                value={formData.key}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    key: e.target.value.toLowerCase().replace(/\s+/g, "_"),
                  })
                }
                disabled={!!editingCategory}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
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

            {/* Dynamic language fields */}
            {languages.map((lang) => (
              <div key={lang.code}>
                <label className="block text-sm font-medium mb-1">
                  Name ({lang.name}){" "}
                  {lang.code === "en" && <span className="text-error">*</span>}
                </label>
                <input
                  type="text"
                  dir={lang.direction === "rtl" ? "rtl" : "ltr"}
                  placeholder={
                    lang.direction === "rtl"
                      ? "اسم الفئة"
                      : `Category name in ${lang.name}`
                  }
                  value={formData.translations[lang.code] || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      translations: {
                        ...formData.translations,
                        [lang.code]: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            ))}

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
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : editingCategory ? "Update" : "Create"}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Categories Table */}
      <div className="bg-card rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">
                  Order
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">
                  Key
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">
                  Name (EN)
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">
                  Name (AR)
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">
                  FAQs
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {categories.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    No categories yet. Create one to get started.
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 text-sm">{category.sortOrder}</td>
                    <td className="px-6 py-4 font-mono text-sm">{category.key}</td>
                    <td className="px-6 py-4">{category.translations.en || "-"}</td>
                    <td className="px-6 py-4" dir="rtl">
                      {category.translations.ar || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm">{category.faqCount}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(category)}
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          category.isActive
                            ? "bg-success/20 text-success"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {category.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="text-primary text-sm hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(category)}
                          className="text-error text-sm hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps<FaqCategoriesPageProps> = async (
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
    const [categories, languages] = await Promise.all([
      prisma.faqCategory.findMany({
        orderBy: { sortOrder: "asc" },
        include: {
          translations: true,
          _count: {
            select: { faqs: true },
          },
        },
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
        languages: activeLanguages,
      },
    };
  } catch (error) {
    console.error("FAQ Categories error:", error);
    return {
      props: {
        categories: [],
        languages: [
          { code: "en", name: "English", direction: "ltr" },
          { code: "ar", name: "العربية", direction: "rtl" },
        ],
      },
    };
  }
};
