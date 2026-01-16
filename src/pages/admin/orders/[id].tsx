import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { useRouter } from "next/router";
import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { authOptions } from "../../api/auth/[...nextauth]";
import prisma from "@/lib/prisma";

interface CustomerInfo {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  businessName: string;
  notes?: string;
}

interface StatusHistoryEntry {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  changedBy: string;
  changedByEmail: string | null;
  note: string | null;
  createdAt: string;
}

interface Order {
  id: string;
  entity: string;
  stateCode: string;
  stateName: string;
  addOns: string[];
  customerInfo: CustomerInfo;
  basePrice: number;
  addOnTotal: number;
  discountAmount: number;
  promoCode: string | null;
  total: number;
  status: string;
  createdAt: string;
  statusHistory: StatusHistoryEntry[];
}

interface OrderDetailPageProps {
  order: Order;
}

const STATUS_OPTIONS = ["pending", "processing", "completed", "cancelled"];

export default function OrderDetailPage({ order }: OrderDetailPageProps) {
  const router = useRouter();
  const [status, setStatus] = useState(order.status);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage("Order updated successfully");
      } else {
        setMessage(data.error || "Failed to update order");
      }
    } catch {
      setMessage("Failed to update order");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <button
            onClick={() => router.back()}
            className="text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            &larr; Back to Orders
          </button>
          <h1 className="text-2xl font-bold">
            Order {order.id.slice(0, 10).toUpperCase()}
          </h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg text-sm ${
            message.includes("success")
              ? "bg-success/10 text-success"
              : "bg-error/10 text-error"
          }`}
        >
          {message}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Order Info */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Order Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order ID:</span>
              <span className="font-mono">{order.id.slice(0, 10).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Entity:</span>
              <span>{order.entity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">State:</span>
              <span>{order.stateName} ({order.stateCode})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span>{new Date(order.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-border">
              <span className="text-muted-foreground">Status:</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-3 py-1 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Customer Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name:</span>
              <span>{order.customerInfo.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span>{order.customerInfo.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone:</span>
              <span>{order.customerInfo.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Country:</span>
              <span>{order.customerInfo.country}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Business Name:</span>
              <span>{order.customerInfo.businessName}</span>
            </div>
            {order.customerInfo.notes && (
              <div className="pt-3 border-t border-border">
                <span className="text-muted-foreground block mb-1">Notes:</span>
                <p className="text-sm">{order.customerInfo.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Pricing</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Base Price:</span>
              <span>${order.basePrice}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Add-ons:</span>
              <span>${order.addOnTotal}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-success">
                <span>Discount {order.promoCode && `(${order.promoCode})`}:</span>
                <span>-${order.discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between pt-3 border-t border-border font-semibold">
              <span>Total:</span>
              <span className="text-primary">${order.total}</span>
            </div>
          </div>
        </div>

        {/* Add-ons */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Selected Add-ons</h2>
          {order.addOns.length === 0 ? (
            <p className="text-muted-foreground">No add-ons selected</p>
          ) : (
            <ul className="space-y-2">
              {order.addOns.map((addOn) => (
                <li key={addOn} className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-success"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="capitalize">{addOn.replace(/_/g, " ")}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Status History Timeline */}
      <div className="mt-6 bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Status History</h2>
        {order.statusHistory.length === 0 ? (
          <p className="text-muted-foreground">No status history available</p>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-border" />

            <div className="space-y-4">
              {order.statusHistory.map((entry, index) => (
                <div key={entry.id} className="relative pl-8">
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-0 top-1.5 w-6 h-6 rounded-full flex items-center justify-center ${
                      index === 0
                        ? "bg-primary text-white"
                        : "bg-muted border-2 border-border"
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${index === 0 ? "bg-white" : "bg-muted-foreground"}`} />
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      {entry.fromStatus ? (
                        <>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              entry.fromStatus === "completed"
                                ? "bg-success/20 text-success"
                                : entry.fromStatus === "pending"
                                ? "bg-warning/20 text-warning"
                                : entry.fromStatus === "processing"
                                ? "bg-primary/20 text-primary"
                                : entry.fromStatus === "cancelled"
                                ? "bg-error/20 text-error"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {entry.fromStatus}
                          </span>
                          <svg
                            className="w-4 h-4 text-muted-foreground"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </>
                      ) : null}
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          entry.toStatus === "completed"
                            ? "bg-success/20 text-success"
                            : entry.toStatus === "pending"
                            ? "bg-warning/20 text-warning"
                            : entry.toStatus === "processing"
                            ? "bg-primary/20 text-primary"
                            : entry.toStatus === "cancelled"
                            ? "bg-error/20 text-error"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {entry.toStatus}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {entry.changedByEmail || entry.changedBy} &middot;{" "}
                      {new Date(entry.createdAt).toLocaleString()}
                    </div>
                    {entry.note && (
                      <div className="text-sm mt-1">{entry.note}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps<OrderDetailPageProps> = async (
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

  const { id } = context.params as { id: string };

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      state: { select: { name: true } },
      statusHistory: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!order) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      order: {
        id: order.id,
        entity: order.entity,
        stateCode: order.stateCode,
        stateName: order.state.name,
        addOns: order.addOns as unknown as string[],
        customerInfo: order.customerInfo as unknown as CustomerInfo,
        basePrice: order.basePrice,
        addOnTotal: order.addOnTotal,
        discountAmount: order.discountAmount,
        promoCode: order.promoCode,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt.toISOString(),
        statusHistory: order.statusHistory.map((h) => ({
          id: h.id,
          fromStatus: h.fromStatus,
          toStatus: h.toStatus,
          changedBy: h.changedBy,
          changedByEmail: h.changedByEmail,
          note: h.note,
          createdAt: h.createdAt.toISOString(),
        })),
      },
    },
  };
};
