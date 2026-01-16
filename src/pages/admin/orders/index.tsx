import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { authOptions } from "../../api/auth/[...nextauth]";
import prisma from "@/lib/prisma";

interface Order {
  id: string;
  stateCode: string;
  total: number;
  status: string;
  createdAt: string;
  customerInfo: {
    fullName?: string;
    email?: string;
  };
}

interface OrdersPageProps {
  orders: Order[];
}

export default function OrdersPage({ orders }: OrdersPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Filter orders based on search query and status
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      searchQuery === "" ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerInfo.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerInfo.fullName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Count by status
  const statusCounts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter((o) => o.status === "processing").length,
    completed: orders.filter((o) => o.status === "completed").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-8">Orders</h1>

      {/* Search and Filters */}
      <div className="bg-card rounded-xl border border-border p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">
              Search by Order ID, Email, or Name
            </label>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="md:w-48">
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All ({statusCounts.all})</option>
              <option value="pending">Pending ({statusCounts.pending})</option>
              <option value="processing">Processing ({statusCounts.processing})</option>
              <option value="completed">Completed ({statusCounts.completed})</option>
              <option value="cancelled">Cancelled ({statusCounts.cancelled})</option>
            </select>
          </div>
        </div>

        {/* Active filters summary */}
        {(searchQuery || statusFilter !== "all") && (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Showing {filteredOrders.length} of {orders.length} orders
            </span>
            {(searchQuery || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
                className="text-primary hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-card rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">
                  Order ID
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">
                  Customer
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">
                  State
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">
                  Total
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    {orders.length === 0
                      ? "No orders yet"
                      : "No orders match your search"}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono text-sm text-primary hover:underline"
                      >
                        {order.id.slice(0, 10).toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">{order.customerInfo.fullName}</div>
                      <div className="text-xs text-muted-foreground">
                        {order.customerInfo.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">{order.stateCode}</td>
                    <td className="px-6 py-4 font-medium">${order.total}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === "completed"
                            ? "bg-success/20 text-success"
                            : order.status === "pending"
                            ? "bg-warning/20 text-warning"
                            : order.status === "processing"
                            ? "bg-primary/20 text-primary"
                            : order.status === "cancelled"
                            ? "bg-error/20 text-error"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
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

export const getServerSideProps: GetServerSideProps<OrdersPageProps> = async (
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

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      stateCode: true,
      total: true,
      status: true,
      createdAt: true,
      customerInfo: true,
    },
  });

  return {
    props: {
      orders: orders.map((order) => ({
        ...order,
        customerInfo: order.customerInfo as { fullName?: string; email?: string },
        createdAt: order.createdAt.toISOString(),
      })),
    },
  };
};
