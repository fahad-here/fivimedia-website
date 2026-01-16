import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { useState, useRef, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { authOptions } from "../api/auth/[...nextauth]";
import prisma from "@/lib/prisma";

interface PromoCode {
  id: string;
  code: string;
  type: string;
  value: number;
  usageLimit: number | null;
  usedCount: number;
  minOrderAmount: number | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

interface PromoCodesPageProps {
  promoCodes: PromoCode[];
}

export default function PromoCodesPage({ promoCodes: initialPromoCodes }: PromoCodesPageProps) {
  const [promoCodes, setPromoCodes] = useState(initialPromoCodes);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [formError, setFormError] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const [newCode, setNewCode] = useState({
    code: "",
    type: "percentage",
    value: "",
    usageLimit: "",
    minOrderAmount: "",
    expiresAt: "",
    isActive: true,
  });

  const [editForm, setEditForm] = useState({
    code: "",
    type: "percentage",
    value: "",
    usageLimit: "",
    minOrderAmount: "",
    expiresAt: "",
    isActive: true,
  });

  useEffect(() => {
    if (showNewForm && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [showNewForm]);

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCode({ ...newCode, code });
  };

  const handleCreate = async () => {
    if (!newCode.code) {
      setFormError("Code is required");
      return;
    }
    if (!newCode.value) {
      setFormError("Value is required");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const response = await fetch("/api/admin/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCode.code,
          type: newCode.type,
          value: parseFloat(newCode.value),
          usageLimit: newCode.usageLimit ? parseInt(newCode.usageLimit, 10) : null,
          minOrderAmount: newCode.minOrderAmount ? parseFloat(newCode.minOrderAmount) : null,
          expiresAt: newCode.expiresAt || null,
          isActive: newCode.isActive,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPromoCodes((prev) => [data.promoCode, ...prev]);
        setNewCode({
          code: "",
          type: "percentage",
          value: "",
          usageLimit: "",
          minOrderAmount: "",
          expiresAt: "",
          isActive: true,
        });
        setShowNewForm(false);
        setMessage({ text: "Promo code created successfully", type: "success" });
      } else {
        setFormError(data.error || "Failed to create promo code");
      }
    } catch {
      setFormError("Failed to create promo code");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string) => {
    setSaving(true);

    try {
      const response = await fetch("/api/admin/promo-codes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          code: editForm.code,
          type: editForm.type,
          value: parseFloat(editForm.value),
          usageLimit: editForm.usageLimit ? parseInt(editForm.usageLimit, 10) : null,
          minOrderAmount: editForm.minOrderAmount ? parseFloat(editForm.minOrderAmount) : null,
          expiresAt: editForm.expiresAt || null,
          isActive: editForm.isActive,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPromoCodes((prev) =>
          prev.map((code) =>
            code.id === id
              ? {
                  ...code,
                  code: editForm.code.toUpperCase(),
                  type: editForm.type,
                  value: parseFloat(editForm.value),
                  usageLimit: editForm.usageLimit ? parseInt(editForm.usageLimit, 10) : null,
                  minOrderAmount: editForm.minOrderAmount ? parseFloat(editForm.minOrderAmount) : null,
                  expiresAt: editForm.expiresAt || null,
                  isActive: editForm.isActive,
                }
              : code
          )
        );
        setEditingCode(null);
        setMessage({ text: "Promo code updated successfully", type: "success" });
      } else {
        setMessage({ text: data.error || "Failed to update promo code", type: "error" });
      }
    } catch {
      setMessage({ text: "Failed to update promo code", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete promo code "${code}"?`)) {
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/admin/promo-codes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (data.success) {
        setPromoCodes((prev) => prev.filter((c) => c.id !== id));
        setMessage({ text: "Promo code deleted successfully", type: "success" });
      } else {
        setMessage({ text: data.error || "Failed to delete promo code", type: "error" });
      }
    } catch {
      setMessage({ text: "Failed to delete promo code", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const response = await fetch("/api/admin/promo-codes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !currentActive }),
      });

      const data = await response.json();

      if (data.success) {
        setPromoCodes((prev) =>
          prev.map((code) =>
            code.id === id ? { ...code, isActive: !currentActive } : code
          )
        );
      }
    } catch {
      setMessage({ text: "Failed to update promo code", type: "error" });
    }
  };

  const startEditing = (code: PromoCode) => {
    setEditingCode(code.id);
    setEditForm({
      code: code.code,
      type: code.type,
      value: code.value.toString(),
      usageLimit: code.usageLimit?.toString() || "",
      minOrderAmount: code.minOrderAmount?.toString() || "",
      expiresAt: code.expiresAt ? code.expiresAt.split("T")[0] : "",
      isActive: code.isActive,
    });
  };

  const formatDiscount = (type: string, value: number) => {
    return type === "percentage" ? `${value}%` : `$${value}`;
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Promo Codes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage discount codes for checkout
          </p>
        </div>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
        >
          {showNewForm ? "Cancel" : "+ Add Promo Code"}
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

      {/* Add New Form */}
      {showNewForm && (
        <div ref={formRef} className="bg-card rounded-xl border border-border mb-8">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold">Create Promo Code</h2>
          </div>
          <div className="p-6">
            {formError && (
              <div className="mb-4 p-3 bg-error/10 text-error rounded-lg text-sm">
                {formError}
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-4 max-w-3xl">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Code <span className="text-error">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCode.code}
                    onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary uppercase"
                    placeholder="SUMMER20"
                  />
                  <button
                    type="button"
                    onClick={generateCode}
                    className="px-3 py-2 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={newCode.type}
                  onChange={(e) => setNewCode({ ...newCode, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ($)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Value <span className="text-error">*</span>
                </label>
                <input
                  type="number"
                  value={newCode.value}
                  onChange={(e) => setNewCode({ ...newCode, value: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={newCode.type === "percentage" ? "10" : "25"}
                  min="0"
                  max={newCode.type === "percentage" ? "100" : undefined}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Usage Limit</label>
                <input
                  type="number"
                  value={newCode.usageLimit}
                  onChange={(e) => setNewCode({ ...newCode, usageLimit: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Unlimited"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Min. Order Amount</label>
                <input
                  type="number"
                  value={newCode.minOrderAmount}
                  onChange={(e) => setNewCode({ ...newCode, minOrderAmount: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="No minimum"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={newCode.expiresAt}
                  onChange={(e) => setNewCode({ ...newCode, expiresAt: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="md:col-span-3">
                <button
                  onClick={handleCreate}
                  disabled={saving}
                  className="px-4 py-2 bg-success text-white rounded-lg font-medium hover:bg-success/90 transition-colors disabled:opacity-50"
                >
                  Create Promo Code
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Promo Codes List */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold">All Promo Codes</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {promoCodes.length} code{promoCodes.length !== 1 ? "s" : ""} total
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Code</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Discount</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Usage</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Min. Order</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Expires</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {promoCodes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    No promo codes yet
                  </td>
                </tr>
              ) : (
                promoCodes.map((code) => (
                  <tr key={code.id} className="hover:bg-muted/50">
                    {editingCode === code.id ? (
                      <>
                        <td colSpan={7} className="px-6 py-4">
                          <div className="grid md:grid-cols-6 gap-4">
                            <input
                              type="text"
                              value={editForm.code}
                              onChange={(e) => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })}
                              className="px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary uppercase"
                            />
                            <select
                              value={editForm.type}
                              onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                              className="px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                              <option value="percentage">%</option>
                              <option value="fixed">$</option>
                            </select>
                            <input
                              type="number"
                              value={editForm.value}
                              onChange={(e) => setEditForm({ ...editForm, value: e.target.value })}
                              className="px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="Value"
                            />
                            <input
                              type="number"
                              value={editForm.usageLimit}
                              onChange={(e) => setEditForm({ ...editForm, usageLimit: e.target.value })}
                              className="px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="Limit"
                            />
                            <input
                              type="date"
                              value={editForm.expiresAt}
                              onChange={(e) => setEditForm({ ...editForm, expiresAt: e.target.value })}
                              className="px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdate(code.id)}
                                disabled={saving}
                                className="px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingCode(null)}
                                className="px-3 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 font-mono font-medium">{code.code}</td>
                        <td className="px-6 py-4">{formatDiscount(code.type, code.value)}</td>
                        <td className="px-6 py-4 text-sm">
                          {code.usedCount}
                          {code.usageLimit !== null && ` / ${code.usageLimit}`}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {code.minOrderAmount !== null ? `$${code.minOrderAmount}` : "-"}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {code.expiresAt
                            ? new Date(code.expiresAt).toLocaleDateString()
                            : "Never"}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleActive(code.id, code.isActive)}
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              code.isActive
                                ? "bg-success/20 text-success"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {code.isActive ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEditing(code)}
                              className="text-primary text-sm hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(code.id, code.code)}
                              disabled={saving}
                              className="text-error text-sm hover:underline disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </>
                    )}
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

export const getServerSideProps: GetServerSideProps<PromoCodesPageProps> = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: "/admin/login",
        permanent: false,
      },
    };
  }

  const promoCodes = await prisma.promoCode.findMany({
    orderBy: { createdAt: "desc" },
  });

  return {
    props: {
      promoCodes: promoCodes.map((code) => ({
        ...code,
        expiresAt: code.expiresAt?.toISOString() || null,
        createdAt: code.createdAt.toISOString(),
        updatedAt: code.updatedAt.toISOString(),
      })),
    },
  };
};
