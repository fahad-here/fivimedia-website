import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { authOptions } from "../api/auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { formatAuditAction, formatAuditEntity } from "@/lib/audit-utils";

interface AuditLogEntry {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  entity: string;
  entityId: string;
  changes: Record<string, { from?: unknown; to?: unknown }> | null;
  createdAt: string;
}

interface AuditLogPageProps {
  logs: AuditLogEntry[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  entities: string[];
}

export default function AuditLogPage({
  logs: initialLogs,
  pagination: initialPagination,
  entities,
}: AuditLogPageProps) {
  const [logs, setLogs] = useState(initialLogs);
  const [pagination, setPagination] = useState(initialPagination);
  const [entityFilter, setEntityFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const fetchLogs = async (page: number, entity: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });
      if (entity !== "all") {
        params.set("entity", entity);
      }

      const response = await fetch(`/api/admin/audit-log?${params}`);
      const data = await response.json();

      if (data.logs) {
        setLogs(data.logs);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEntityChange = (entity: string) => {
    setEntityFilter(entity);
    fetchLogs(1, entity);
  };

  const handlePageChange = (newPage: number) => {
    fetchLogs(newPage, entityFilter);
  };

  const formatChanges = (changes: Record<string, { from?: unknown; to?: unknown }> | null) => {
    if (!changes) return null;

    return Object.entries(changes).map(([field, { from, to }]) => (
      <div key={field} className="text-sm">
        <span className="font-medium">{field}:</span>{" "}
        <span className="text-error line-through">{JSON.stringify(from)}</span>
        {" → "}
        <span className="text-success">{JSON.stringify(to)}</span>
      </div>
    ));
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Audit Log</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track admin actions and changes
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4 mb-6">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Filter by Entity</label>
            <select
              value={entityFilter}
              onChange={(e) => handleEntityChange(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Entities</option>
              {entities.map((entity) => (
                <option key={entity} value={entity}>
                  {formatAuditEntity(entity)}
                </option>
              ))}
            </select>
          </div>
          <div className="text-sm text-muted-foreground self-end pb-2">
            {pagination.totalCount} entries
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-card rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">
                  Date
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">
                  User
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">
                  Action
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">
                  Entity
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">
                  Entity ID
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <>
                    <tr key={log.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 text-sm">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm">{log.userEmail}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            log.action === "create"
                              ? "bg-success/20 text-success"
                              : log.action === "update"
                              ? "bg-warning/20 text-warning"
                              : log.action === "delete"
                              ? "bg-error/20 text-error"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {formatAuditAction(log.action)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">{formatAuditEntity(log.entity)}</td>
                      <td className="px-6 py-4 font-mono text-xs">
                        {log.entityId.slice(0, 12)}...
                      </td>
                      <td className="px-6 py-4">
                        {log.changes ? (
                          <button
                            onClick={() =>
                              setExpandedLog(expandedLog === log.id ? null : log.id)
                            }
                            className="text-primary text-sm hover:underline"
                          >
                            {expandedLog === log.id ? "Hide" : "View"} Changes
                          </button>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </td>
                    </tr>
                    {expandedLog === log.id && log.changes && (
                      <tr key={`${log.id}-details`}>
                        <td colSpan={6} className="px-6 py-4 bg-muted/30">
                          <div className="space-y-1">{formatChanges(log.changes)}</div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps<AuditLogPageProps> = async (
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
    const [logs, totalCount, distinctEntities] = await Promise.all([
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.auditLog.count(),
      prisma.auditLog.findMany({
        distinct: ["entity"],
        select: { entity: true },
      }),
    ]);

    return {
      props: {
        logs: logs.map((log) => ({
          ...log,
          changes: log.changes as Record<string, { from?: unknown; to?: unknown }> | null,
          createdAt: log.createdAt.toISOString(),
        })),
        pagination: {
          page: 1,
          limit: 50,
          totalCount,
          totalPages: Math.ceil(totalCount / 50),
        },
        entities: distinctEntities.map((e) => e.entity),
      },
    };
  } catch (error) {
    console.error("Audit log error:", error);
    return {
      props: {
        logs: [],
        pagination: { page: 1, limit: 50, totalCount: 0, totalPages: 0 },
        entities: [],
      },
    };
  }
};
