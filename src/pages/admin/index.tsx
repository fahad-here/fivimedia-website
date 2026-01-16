import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import AdminLayout from "@/components/admin/AdminLayout";
import { authOptions } from "../api/auth/[...nextauth]";
import prisma from "@/lib/prisma";

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  revenue: number;
}

interface ConversionMetrics {
  orderCompletionRate: number;
  totalLeads: number;
  newLeads: number;
}

interface PopularState {
  stateCode: string;
  stateName: string;
  orderCount: number;
}

interface RecentOrder {
  id: string;
  stateCode: string;
  total: number;
  status: string;
  createdAt: string;
}

interface AdminDashboardProps {
  stats: DashboardStats;
  conversionMetrics: ConversionMetrics;
  popularStates: PopularState[];
  recentOrders: RecentOrder[];
}

export default function AdminDashboard({
  stats,
  conversionMetrics,
  popularStates,
  recentOrders,
}: AdminDashboardProps) {
  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-8">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-card rounded-xl p-6 border border-border">
          <div className="text-sm text-muted-foreground mb-1">Total Orders</div>
          <div className="text-3xl font-bold">{stats.totalOrders}</div>
        </div>
        <div className="bg-card rounded-xl p-6 border border-border">
          <div className="text-sm text-muted-foreground mb-1">Pending Orders</div>
          <div className="text-3xl font-bold text-warning">{stats.pendingOrders}</div>
        </div>
        <div className="bg-card rounded-xl p-6 border border-border">
          <div className="text-sm text-muted-foreground mb-1">Completed</div>
          <div className="text-3xl font-bold text-success">{stats.completedOrders}</div>
        </div>
        <div className="bg-card rounded-xl p-6 border border-border">
          <div className="text-sm text-muted-foreground mb-1">Revenue</div>
          <div className="text-3xl font-bold text-success">
            ${stats.revenue.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground mt-1">excludes cancelled</div>
        </div>
      </div>

      {/* Conversion Metrics & Popular States */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Conversion Metrics */}
        <div className="bg-card rounded-xl border border-border">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold">Conversion Metrics</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Order Completion Rate</div>
                <div className="text-xs text-muted-foreground">completed / total orders</div>
              </div>
              <div className="text-2xl font-bold">
                {conversionMetrics.orderCompletionRate.toFixed(1)}%
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-success h-2 rounded-full transition-all"
                style={{ width: `${Math.min(conversionMetrics.orderCompletionRate, 100)}%` }}
              />
            </div>
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Total Leads</div>
                  <div className="text-xs text-muted-foreground">contact form submissions</div>
                </div>
                <div className="text-2xl font-bold">{conversionMetrics.totalLeads}</div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="text-sm text-muted-foreground">New (uncontacted)</div>
                <div className="text-lg font-semibold text-primary">
                  {conversionMetrics.newLeads}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Popular States */}
        <div className="bg-card rounded-xl border border-border">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold">Popular States</h2>
          </div>
          <div className="p-6">
            {popularStates.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                No order data yet
              </div>
            ) : (
              <div className="space-y-3">
                {popularStates.map((state, index) => (
                  <div key={state.stateCode} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-medium flex items-center justify-center">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {state.stateCode}{" "}
                          <span className="text-muted-foreground font-normal">
                            ({state.stateName})
                          </span>
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {state.orderCount} order{state.orderCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                        <div
                          className="bg-primary h-1.5 rounded-full transition-all"
                          style={{
                            width: `${(state.orderCount / (popularStates[0]?.orderCount || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">
                  Order ID
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
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No orders yet
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 font-mono text-sm">
                      {order.id.slice(0, 10).toUpperCase()}
                    </td>
                    <td className="px-6 py-4">{order.stateCode}</td>
                    <td className="px-6 py-4">${order.total}</td>
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

export const getServerSideProps: GetServerSideProps<AdminDashboardProps> = async (
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
    const [
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      revenueResult,
      totalLeads,
      newLeads,
      recentOrders,
      stateOrderCounts,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "pending" } }),
      prisma.order.count({ where: { status: "completed" } }),
      prisma.order.count({ where: { status: "cancelled" } }),
      // Revenue excludes cancelled orders
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { not: "cancelled" } },
      }),
      // Leads count
      prisma.contactSubmission.count(),
      prisma.contactSubmission.count({ where: { status: "new" } }),
      // Recent orders
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          stateCode: true,
          total: true,
          status: true,
          createdAt: true,
        },
      }),
      // Top 5 popular states
      prisma.order.groupBy({
        by: ["stateCode"],
        _count: { stateCode: true },
        orderBy: { _count: { stateCode: "desc" } },
        take: 5,
      }),
    ]);

    // Get state names for popular states
    const stateCodes = stateOrderCounts.map((s) => s.stateCode);
    const states = await prisma.state.findMany({
      where: { code: { in: stateCodes } },
      select: { code: true, name: true },
    });
    const stateNameMap = new Map(states.map((s) => [s.code, s.name]));

    // Calculate order completion rate
    const orderCompletionRate =
      totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    return {
      props: {
        stats: {
          totalOrders,
          pendingOrders,
          completedOrders,
          cancelledOrders,
          revenue: revenueResult._sum.total || 0,
        },
        conversionMetrics: {
          orderCompletionRate,
          totalLeads,
          newLeads,
        },
        popularStates: stateOrderCounts.map((s) => ({
          stateCode: s.stateCode,
          stateName: stateNameMap.get(s.stateCode) || s.stateCode,
          orderCount: s._count.stateCode,
        })),
        recentOrders: recentOrders.map((order) => ({
          ...order,
          createdAt: order.createdAt.toISOString(),
        })),
      },
    };
  } catch (error) {
    console.error("Dashboard error:", error);
    return {
      props: {
        stats: {
          totalOrders: 0,
          pendingOrders: 0,
          completedOrders: 0,
          cancelledOrders: 0,
          revenue: 0,
        },
        conversionMetrics: {
          orderCompletionRate: 0,
          totalLeads: 0,
          newLeads: 0,
        },
        popularStates: [],
        recentOrders: [],
      },
    };
  }
};
