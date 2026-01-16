import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { useState, useRef, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { authOptions } from "../api/auth/[...nextauth]";
import prisma from "@/lib/prisma";

interface CoverageItem {
  id: string;
  key: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  sortOrder: number;
}

interface StateCoverage {
  coverageItemId: string;
  enabled: boolean;
  processingTime: string | null;
}

interface State {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

interface Language {
  code: string;
  name: string;
  direction: string;
}

interface StatesPageProps {
  states: State[];
  coverageItems: CoverageItem[];
  initialCoverage: Record<string, StateCoverage[]>;
  languages: Language[];
}

export default function StatesPage({
  states: initialStates,
  coverageItems: initialCoverageItems,
  initialCoverage,
  languages,
}: StatesPageProps) {
  const [states, setStates] = useState(initialStates);
  const [coverageItems, setCoverageItems] = useState(initialCoverageItems);
  const [selectedState, setSelectedState] = useState(states[0]?.code || "");
  const [coverage, setCoverage] = useState(initialCoverage);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [formError, setFormError] = useState("");
  const messageRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // New coverage item form with dynamic language fields
  const [showNewItemForm, setShowNewItemForm] = useState(false);
  const [newItem, setNewItem] = useState<{
    key: string;
    titles: Record<string, string>;
    descriptions: Record<string, string>;
  }>(() => {
    const titles: Record<string, string> = {};
    const descriptions: Record<string, string> = {};
    languages.forEach(lang => {
      titles[lang.code] = "";
      descriptions[lang.code] = "";
    });
    return { key: "", titles, descriptions };
  });

  // Scroll to form when opening
  useEffect(() => {
    if (showNewItemForm && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [showNewItemForm]);

  const showGlobalMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    if (messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const currentCoverage = coverage[selectedState] || [];

  const handleToggle = (coverageItemId: string) => {
    setCoverage((prev) => ({
      ...prev,
      [selectedState]: prev[selectedState].map((c) =>
        c.coverageItemId === coverageItemId ? { ...c, enabled: !c.enabled } : c
      ),
    }));
  };

  const handleProcessingTime = (coverageItemId: string, time: string) => {
    setCoverage((prev) => ({
      ...prev,
      [selectedState]: prev[selectedState].map((c) =>
        c.coverageItemId === coverageItemId
          ? { ...c, processingTime: time || null }
          : c
      ),
    }));
  };

  const handleStateToggle = (code: string) => {
    setStates((prev) =>
      prev.map((s) => (s.code === code ? { ...s, isActive: !s.isActive } : s))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await fetch("/api/admin/states", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stateCode: selectedState,
          coverage: currentCoverage,
          states: states.map((s) => ({ code: s.code, isActive: s.isActive })),
        }),
      });

      const data = await response.json();

      if (data.success) {
        showGlobalMessage("Changes saved successfully", "success");
      } else {
        showGlobalMessage(data.error || "Failed to save changes", "error");
      }
    } catch {
      showGlobalMessage("Failed to save changes", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddCoverageItem = async () => {
    if (!newItem.key) {
      setFormError("Key is required");
      return;
    }

    // Check if at least English title is filled
    const hasEnglishTitle = newItem.titles["en"];
    if (!hasEnglishTitle) {
      setFormError("English title is required");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      // Map to the expected API format
      const payload = {
        key: newItem.key,
        titleEn: newItem.titles["en"] || "",
        titleAr: newItem.titles["ar"] || "",
        descriptionEn: newItem.descriptions["en"] || "",
        descriptionAr: newItem.descriptions["ar"] || "",
      };

      const response = await fetch("/api/admin/coverage-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        // Add new item to local state
        const createdItem = data.coverageItem;
        setCoverageItems((prev) => [...prev, createdItem]);

        // Add to all states' coverage
        setCoverage((prev) => {
          const updated = { ...prev };
          for (const stateCode of Object.keys(updated)) {
            updated[stateCode] = [
              ...updated[stateCode],
              { coverageItemId: createdItem.id, enabled: true, processingTime: null },
            ];
          }
          return updated;
        });

        // Reset form
        const titles: Record<string, string> = {};
        const descriptions: Record<string, string> = {};
        languages.forEach(lang => {
          titles[lang.code] = "";
          descriptions[lang.code] = "";
        });
        setNewItem({ key: "", titles, descriptions });
        setShowNewItemForm(false);
        showGlobalMessage("Coverage item added successfully", "success");
      } else {
        setFormError(data.error || "Failed to add coverage item");
      }
    } catch {
      setFormError("Failed to add coverage item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">State & Coverage Management</h1>
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

      {/* States Enable/Disable */}
      <div className="bg-card rounded-xl border border-border mb-8">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold">Enable/Disable States</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Disabled states will not appear in the wizard
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {states.map((state) => (
              <label
                key={state.code}
                className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                  state.isActive
                    ? "border-success bg-success/10"
                    : "border-border bg-muted opacity-60"
                }`}
              >
                <input
                  type="checkbox"
                  checked={state.isActive}
                  onChange={() => handleStateToggle(state.code)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary flex-shrink-0"
                />
                <span className="text-sm font-medium truncate">
                  {state.code} ({state.name})
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Coverage Items Management */}
      <div className="bg-card rounded-xl border border-border mb-8">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Coverage Items</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage coverage items available across all states
            </p>
          </div>
          <button
            onClick={() => setShowNewItemForm(!showNewItemForm)}
            className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors text-sm"
          >
            {showNewItemForm ? "Cancel" : "+ Add Item"}
          </button>
        </div>

        {showNewItemForm && (
          <div ref={formRef} className="p-6 border-b border-border bg-muted/50">
            <h3 className="font-medium mb-4">New Coverage Item</h3>

            {formError && (
              <div className="mb-4 p-3 bg-error/10 text-error rounded-lg text-sm">
                {formError}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Key (unique identifier) <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., annual_report"
                  value={newItem.key}
                  onChange={(e) => setNewItem({ ...newItem, key: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                  className="w-full max-w-md px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Dynamic language title fields */}
              {languages.map((lang) => (
                <div key={`title-${lang.code}`}>
                  <label className="block text-sm font-medium mb-1">
                    Title ({lang.name}) {lang.code === "en" && <span className="text-error">*</span>}
                  </label>
                  <input
                    type="text"
                    dir={lang.direction === "rtl" ? "rtl" : "ltr"}
                    placeholder={lang.direction === "rtl" ? "العنوان" : `Title in ${lang.name}`}
                    value={newItem.titles[lang.code] || ""}
                    onChange={(e) => setNewItem({
                      ...newItem,
                      titles: { ...newItem.titles, [lang.code]: e.target.value }
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
                    value={newItem.descriptions[lang.code] || ""}
                    onChange={(e) => setNewItem({
                      ...newItem,
                      descriptions: { ...newItem.descriptions, [lang.code]: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              ))}

              <div className="md:col-span-2">
                <button
                  onClick={handleAddCoverageItem}
                  disabled={saving}
                  className="px-4 py-2 bg-success text-white rounded-lg font-medium hover:bg-success/90 transition-colors disabled:opacity-50"
                >
                  Add Coverage Item
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="p-6">
          <div className="space-y-2">
            {coverageItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div>
                  <span className="font-medium">{item.titleEn}</span>
                  <span className="text-muted-foreground mx-2">|</span>
                  <span className="text-muted-foreground" dir="rtl">{item.titleAr}</span>
                  <span className="text-xs text-muted-foreground ml-2">({item.key})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* State-specific Coverage */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-6 border-b border-border">
          <label className="block text-sm font-medium mb-2">Select State for Coverage Settings</label>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="w-full max-w-xs px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {states.map((state) => (
              <option key={state.code} value={state.code}>
                {state.name} ({state.code}) {!state.isActive && "(Disabled)"}
              </option>
            ))}
          </select>
        </div>

        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Coverage Items for {selectedState}</h3>
          <div className="space-y-4">
            {coverageItems.map((item) => {
              const itemCoverage = currentCoverage.find(
                (c) => c.coverageItemId === item.id
              );
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 bg-muted rounded-lg"
                >
                  <label className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={itemCoverage?.enabled ?? true}
                      onChange={() => handleToggle(item.id)}
                      className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="font-medium">{item.titleEn}</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground">
                      Processing Time:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 10-12 days"
                      value={itemCoverage?.processingTime || ""}
                      onChange={(e) =>
                        handleProcessingTime(item.id, e.target.value)
                      }
                      className="w-40 px-3 py-1 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps<StatesPageProps> = async (
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

  const [states, coverageItems, stateCoverage, languages] = await Promise.all([
    prisma.state.findMany({
      orderBy: { name: "asc" },
      select: { id: true, code: true, name: true, isActive: true },
    }),
    prisma.coverageItem.findMany({
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        key: true,
        titleEn: true,
        titleAr: true,
        descriptionEn: true,
        descriptionAr: true,
        sortOrder: true,
      },
    }),
    prisma.stateCoverage.findMany({
      select: {
        coverageItemId: true,
        enabled: true,
        processingTime: true,
        state: { select: { code: true } },
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

  // Group coverage by state code
  const initialCoverage: Record<string, StateCoverage[]> = {};
  for (const state of states) {
    initialCoverage[state.code] = coverageItems.map((item) => {
      const existing = stateCoverage.find(
        (sc) => sc.state.code === state.code && sc.coverageItemId === item.id
      );
      return {
        coverageItemId: item.id,
        enabled: existing?.enabled ?? true,
        processingTime: existing?.processingTime ?? null,
      };
    });
  }

  return {
    props: {
      states: states.map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        isActive: s.isActive,
      })),
      coverageItems: coverageItems.map((c) => ({
        id: c.id,
        key: c.key,
        titleEn: c.titleEn,
        titleAr: c.titleAr,
        descriptionEn: c.descriptionEn,
        descriptionAr: c.descriptionAr,
        sortOrder: c.sortOrder,
      })),
      initialCoverage,
      languages: activeLanguages,
    },
  };
};
