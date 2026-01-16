import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { useState, useRef, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { authOptions } from "../api/auth/[...nextauth]";
import prisma from "@/lib/prisma";

interface Language {
  id: string;
  code: string;
  name: string;
  direction: string;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
}

interface LanguagesPageProps {
  languages: Language[];
}

export default function LanguagesPage({ languages: initialLanguages }: LanguagesPageProps) {
  const [languages, setLanguages] = useState(initialLanguages);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const messageRef = useRef<HTMLDivElement>(null);

  // New language form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newLanguage, setNewLanguage] = useState({
    code: "",
    name: "",
    direction: "ltr",
  });
  const formRef = useRef<HTMLDivElement>(null);

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    // Scroll to message if it's an error
    if (type === "error" && messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleLanguageChange = (id: string, field: string, value: string | boolean | number) => {
    setLanguages((prev) =>
      prev.map((lang) => {
        if (lang.id === id) {
          // If setting this as default, unset others
          if (field === "isDefault" && value === true) {
            return { ...lang, [field]: value, isActive: true }; // Default must be active
          }
          return { ...lang, [field]: value };
        }
        // Unset other defaults if this one is being set as default
        if (field === "isDefault" && value === true) {
          return { ...lang, isDefault: false };
        }
        return lang;
      })
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ text: "", type: "" });

    // Validate at least one active language and one default
    const hasActive = languages.some((l) => l.isActive);
    const hasDefault = languages.some((l) => l.isDefault);

    if (!hasActive) {
      showMessage("At least one language must be active", "error");
      setSaving(false);
      return;
    }

    if (!hasDefault) {
      showMessage("One language must be set as default", "error");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/languages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ languages }),
      });

      const data = await response.json();

      if (data.success) {
        showMessage("Languages updated successfully", "success");
      } else {
        showMessage(data.error || "Failed to update languages", "error");
      }
    } catch {
      showMessage("Failed to update languages", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddLanguage = async () => {
    if (!newLanguage.code || !newLanguage.name) {
      showMessage("Code and name are required", "error");
      return;
    }

    // Check for duplicate code
    if (languages.some((l) => l.code.toLowerCase() === newLanguage.code.toLowerCase())) {
      showMessage("Language code already exists", "error");
      return;
    }

    setSaving(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await fetch("/api/admin/languages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newLanguage,
          code: newLanguage.code.toLowerCase(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setLanguages((prev) => [...prev, data.language]);
        setNewLanguage({ code: "", name: "", direction: "ltr" });
        setShowNewForm(false);
        showMessage("Language added successfully", "success");
      } else {
        showMessage(data.error || "Failed to add language", "error");
      }
    } catch {
      showMessage("Failed to add language", "error");
    } finally {
      setSaving(false);
    }
  };

  // Scroll to form when showing
  useEffect(() => {
    if (showNewForm && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [showNewForm]);

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Language Settings</h1>
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

      <div className="bg-card rounded-xl border border-border">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Configured Languages</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage languages for your application. Active languages appear in the language selector.
            </p>
          </div>
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors text-sm"
          >
            {showNewForm ? "Cancel" : "+ Add Language"}
          </button>
        </div>

        {showNewForm && (
          <div ref={formRef} className="p-6 border-b border-border bg-muted/50">
            <h3 className="font-medium mb-4">New Language</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Code <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., fr, de, es"
                  value={newLanguage.code}
                  onChange={(e) =>
                    setNewLanguage({ ...newLanguage, code: e.target.value.toLowerCase() })
                  }
                  maxLength={5}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  ISO 639-1 language code (2 letters)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Fran&#231;ais, Deutsch"
                  value={newLanguage.name}
                  onChange={(e) =>
                    setNewLanguage({ ...newLanguage, name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Display name in native language
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Direction</label>
                <select
                  value={newLanguage.direction}
                  onChange={(e) =>
                    setNewLanguage({ ...newLanguage, direction: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="ltr">Left to Right (LTR)</option>
                  <option value="rtl">Right to Left (RTL)</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={handleAddLanguage}
                disabled={saving}
                className="px-4 py-2 bg-success text-white rounded-lg font-medium hover:bg-success/90 transition-colors disabled:opacity-50"
              >
                Add Language
              </button>
            </div>
          </div>
        )}

        <div className="p-6">
          <div className="space-y-4">
            {languages.map((lang) => (
              <div
                key={lang.id}
                className={`p-4 rounded-lg ${
                  lang.isDefault ? "bg-primary/5 border border-primary/20" : "bg-muted"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm bg-background px-2 py-1 rounded border border-border">
                      {lang.code}
                    </span>
                    <span className="font-medium">{lang.name}</span>
                    <span className="text-xs text-muted-foreground uppercase">
                      {lang.direction}
                    </span>
                    {lang.isDefault && (
                      <span className="text-xs bg-primary text-white px-2 py-0.5 rounded">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={lang.isActive}
                        onChange={(e) =>
                          handleLanguageChange(lang.id, "isActive", e.target.checked)
                        }
                        disabled={lang.isDefault} // Can't disable default language
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary disabled:opacity-50"
                      />
                      <span className="text-sm">Active</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="defaultLanguage"
                        checked={lang.isDefault}
                        onChange={() => handleLanguageChange(lang.id, "isDefault", true)}
                        className="w-4 h-4 border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm">Default</span>
                    </label>
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={lang.name}
                      onChange={(e) =>
                        handleLanguageChange(lang.id, "name", e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      Direction
                    </label>
                    <select
                      value={lang.direction}
                      onChange={(e) =>
                        handleLanguageChange(lang.id, "direction", e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="ltr">Left to Right (LTR)</option>
                      <option value="rtl">Right to Left (RTL)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      value={lang.sortOrder}
                      onChange={(e) =>
                        handleLanguageChange(lang.id, "sortOrder", parseInt(e.target.value) || 0)
                      }
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            ))}

            {languages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No languages configured. Add one to get started.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="font-medium mb-2">Usage Notes</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>
            &bull; The <strong>default language</strong> is used when no language preference is
            detected.
          </li>
          <li>
            &bull; Only <strong>active languages</strong> appear in the language selector.
          </li>
          <li>
            &bull; Language fields in Add-ons and Coverage items will auto-generate inputs for all
            active languages.
          </li>
          <li>
            &bull; After adding a new language, you&apos;ll need to create translation files in{" "}
            <code className="bg-background px-1 rounded">src/messages/</code>.
          </li>
        </ul>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps<LanguagesPageProps> = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: "/admin/login",
        permanent: false,
      },
    };
  }

  const languages = await prisma.language.findMany({
    orderBy: { sortOrder: "asc" },
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

  return {
    props: {
      languages,
    },
  };
};
