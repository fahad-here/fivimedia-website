import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { useState, useRef, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { authOptions } from "../api/auth/[...nextauth]";
import prisma from "@/lib/prisma";

interface State {
  id: string;
  code: string;
  name: string;
  basePrice: number;
}

interface AddOn {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  price: number;
  isActive: boolean;
}

interface Language {
  code: string;
  name: string;
  direction: string;
}

interface PricingPageProps {
  states: State[];
  addOns: AddOn[];
  languages: Language[];
}

export default function PricingPage({
  states: initialStates,
  addOns: initialAddOns,
  languages
}: PricingPageProps) {
  const [states, setStates] = useState(initialStates);
  const [addOns, setAddOns] = useState(initialAddOns);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [addOnFormError, setAddOnFormError] = useState("");
  const messageRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // New add-on form with dynamic language fields
  const [showNewAddOnForm, setShowNewAddOnForm] = useState(false);
  const [newAddOn, setNewAddOn] = useState<{
    slug: string;
    price: number;
    names: Record<string, string>;
    descriptions: Record<string, string>;
  }>(() => {
    const names: Record<string, string> = {};
    const descriptions: Record<string, string> = {};
    languages.forEach(lang => {
      names[lang.code] = "";
      descriptions[lang.code] = "";
    });
    return { slug: "", price: 0, names, descriptions };
  });

  // Scroll to form when opening
  useEffect(() => {
    if (showNewAddOnForm && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [showNewAddOnForm]);

  const handleStatePrice = (code: string, price: number) => {
    setStates((prev) =>
      prev.map((s) => (s.code === code ? { ...s, basePrice: price } : s))
    );
  };

  const handleAddOnChange = (slug: string, field: string, value: string | number | boolean) => {
    setAddOns((prev) =>
      prev.map((a) => (a.slug === slug ? { ...a, [field]: value } : a))
    );
  };

  const showGlobalMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    if (messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await fetch("/api/admin/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ states, addOns }),
      });

      const data = await response.json();

      if (data.success) {
        showGlobalMessage("Pricing updated successfully", "success");
      } else {
        showGlobalMessage(data.error || "Failed to update pricing", "error");
      }
    } catch {
      showGlobalMessage("Failed to update pricing", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddNewAddOn = async () => {
    // Validate required fields - at least one language name is required
    if (!newAddOn.slug) {
      setAddOnFormError("Slug is required");
      return;
    }

    // Check if at least default language names are filled
    const hasEnglishName = newAddOn.names["en"];
    if (!hasEnglishName) {
      setAddOnFormError("English name is required");
      return;
    }

    setSaving(true);
    setAddOnFormError("");

    try {
      // Map to the expected API format (nameEn, nameAr, etc.)
      const payload = {
        slug: newAddOn.slug,
        price: newAddOn.price,
        nameEn: newAddOn.names["en"] || "",
        nameAr: newAddOn.names["ar"] || "",
        descriptionEn: newAddOn.descriptions["en"] || "",
        descriptionAr: newAddOn.descriptions["ar"] || "",
      };

      const response = await fetch("/api/admin/addons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        setAddOns((prev) => [...prev, data.addOn]);
        // Reset form
        const names: Record<string, string> = {};
        const descriptions: Record<string, string> = {};
        languages.forEach(lang => {
          names[lang.code] = "";
          descriptions[lang.code] = "";
        });
        setNewAddOn({ slug: "", price: 0, names, descriptions });
        setShowNewAddOnForm(false);
        showGlobalMessage("Add-on created successfully", "success");
      } else {
        setAddOnFormError(data.error || "Failed to create add-on");
      }
    } catch {
      setAddOnFormError("Failed to create add-on");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Pricing Management</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div ref={messageRef}>
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
      </div>

      {/* State Pricing */}
      <div className="bg-card rounded-xl border border-border mb-8">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold">State Base Prices</h2>
        </div>
        <div className="p-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {states.map((state) => (
              <div key={state.code} className="flex items-center gap-3">
                <div className="w-36 flex-shrink-0">
                  <span className="text-sm font-medium">{state.code}</span>
                  <span className="text-xs text-muted-foreground ml-1 truncate">
                    ({state.name})
                  </span>
                </div>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <input
                    type="number"
                    value={state.basePrice}
                    onChange={(e) =>
                      handleStatePrice(state.code, parseFloat(e.target.value) || 0)
                    }
                    className="w-full pl-8 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add-on Management */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="text-lg font-semibold">Add-ons</h2>
          <button
            onClick={() => setShowNewAddOnForm(!showNewAddOnForm)}
            className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors text-sm"
          >
            {showNewAddOnForm ? "Cancel" : "+ Add New"}
          </button>
        </div>

        {showNewAddOnForm && (
          <div ref={formRef} className="p-6 border-b border-border bg-muted/50">
            <h3 className="font-medium mb-4">New Add-on</h3>

            {addOnFormError && (
              <div className="mb-4 p-3 bg-error/10 text-error rounded-lg text-sm">
                {addOnFormError}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Slug (unique identifier) <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., expedited_filing"
                  value={newAddOn.slug}
                  onChange={(e) => setNewAddOn({ ...newAddOn, slug: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price ($)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={newAddOn.price}
                  onChange={(e) => setNewAddOn({ ...newAddOn, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Dynamic language name fields */}
              {languages.map((lang) => (
                <div key={`name-${lang.code}`}>
                  <label className="block text-sm font-medium mb-1">
                    Name ({lang.name}) {lang.code === "en" && <span className="text-error">*</span>}
                  </label>
                  <input
                    type="text"
                    dir={lang.direction === "rtl" ? "rtl" : "ltr"}
                    placeholder={lang.direction === "rtl" ? "الاسم" : `Name in ${lang.name}`}
                    value={newAddOn.names[lang.code] || ""}
                    onChange={(e) => setNewAddOn({
                      ...newAddOn,
                      names: { ...newAddOn.names, [lang.code]: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              ))}

              {/* Dynamic language description fields */}
              {languages.map((lang) => (
                <div key={`desc-${lang.code}`}>
                  <label className="block text-sm font-medium mb-1">
                    Description ({lang.name})
                  </label>
                  <input
                    type="text"
                    dir={lang.direction === "rtl" ? "rtl" : "ltr"}
                    placeholder={lang.direction === "rtl" ? "الوصف (اختياري)" : "Optional description"}
                    value={newAddOn.descriptions[lang.code] || ""}
                    onChange={(e) => setNewAddOn({
                      ...newAddOn,
                      descriptions: { ...newAddOn.descriptions, [lang.code]: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              ))}

              <div className="md:col-span-2">
                <button
                  onClick={handleAddNewAddOn}
                  disabled={saving}
                  className="px-4 py-2 bg-success text-white rounded-lg font-medium hover:bg-success/90 transition-colors disabled:opacity-50"
                >
                  Create Add-on
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="p-6">
          <div className="space-y-4">
            {addOns.map((addOn) => (
              <div key={addOn.slug} className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-medium">{addOn.nameEn}</span>
                    <span className="text-muted-foreground mx-2">|</span>
                    <span className="text-muted-foreground" dir="rtl">{addOn.nameAr}</span>
                    <span className="text-xs text-muted-foreground ml-2">({addOn.slug})</span>
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={addOn.isActive}
                      onChange={(e) => handleAddOnChange(addOn.slug, "isActive", e.target.checked)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm">Active</span>
                  </label>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Price ($)</label>
                    <input
                      type="number"
                      value={addOn.price}
                      onChange={(e) =>
                        handleAddOnChange(addOn.slug, "price", parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Name (EN)</label>
                    <input
                      type="text"
                      value={addOn.nameEn}
                      onChange={(e) => handleAddOnChange(addOn.slug, "nameEn", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Name (AR)</label>
                    <input
                      type="text"
                      dir="rtl"
                      value={addOn.nameAr}
                      onChange={(e) => handleAddOnChange(addOn.slug, "nameAr", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps<PricingPageProps> = async (
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

  const [states, addOns, languages] = await Promise.all([
    prisma.state.findMany({
      orderBy: { name: "asc" },
      select: { id: true, code: true, name: true, basePrice: true },
    }),
    prisma.addOn.findMany({
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        slug: true,
        nameEn: true,
        nameAr: true,
        descriptionEn: true,
        descriptionAr: true,
        price: true,
        isActive: true,
      },
    }),
    prisma.language.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { code: true, name: true, direction: true },
    }),
  ]);

  // Fallback to default languages if none configured
  const activeLanguages = languages.length > 0 ? languages : [
    { code: "en", name: "English", direction: "ltr" },
    { code: "ar", name: "العربية", direction: "rtl" },
  ];

  return {
    props: {
      states,
      addOns,
      languages: activeLanguages,
    },
  };
};
