import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { authOptions } from "../api/auth/[...nextauth]";
import prisma from "@/lib/prisma";

interface Lead {
  id: string;
  name: string;
  email: string;
  message: string;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface LeadsPageProps {
  leads: Lead[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  statusCounts: {
    all: number;
    new: number;
    contacted: number;
    closed: number;
  };
}

const STATUS_OPTIONS = ["new", "contacted", "closed"];

export default function LeadsPage({
  leads: initialLeads,
  pagination: initialPagination,
  statusCounts,
}: LeadsPageProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [pagination, setPagination] = useState(initialPagination);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });

  const fetchLeads = async (page: number, status: string, search: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "25",
      });
      if (status !== "all") {
        params.set("status", status);
      }
      if (search) {
        params.set("search", search);
      }

      const response = await fetch(`/api/admin/leads?${params}`);
      const data = await response.json();

      if (data.leads) {
        setLeads(data.leads);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const response = await fetch("/api/admin/leads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadId, status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        setLeads((prev) =>
          prev.map((lead) =>
            lead.id === leadId ? { ...lead, status: newStatus } : lead
          )
        );
        setMessage({ text: "Status updated", type: "success" });
      } else {
        setMessage({ text: data.error || "Failed to update", type: "error" });
      }
    } catch {
      setMessage({ text: "Failed to update status", type: "error" });
    }
  };

  const handleSaveNotes = async (leadId: string) => {
    try {
      const response = await fetch("/api/admin/leads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadId, notes: notesValue }),
      });

      const data = await response.json();

      if (data.success) {
        setLeads((prev) =>
          prev.map((lead) =>
            lead.id === leadId ? { ...lead, notes: notesValue } : lead
          )
        );
        setEditingNotes(null);
        setMessage({ text: "Notes saved", type: "success" });
      } else {
        setMessage({ text: data.error || "Failed to save notes", type: "error" });
      }
    } catch {
      setMessage({ text: "Failed to save notes", type: "error" });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLeads(1, statusFilter, searchQuery);
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setSearchQuery("");
    fetchLeads(1, "all", "");
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Contact form submissions
          </p>
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

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
            >
              Search
            </button>
          </form>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                fetchLeads(1, e.target.value, searchQuery);
              }}
              className="px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All ({statusCounts.all})</option>
              <option value="new">New ({statusCounts.new})</option>
              <option value="contacted">Contacted ({statusCounts.contacted})</option>
              <option value="closed">Closed ({statusCounts.closed})</option>
            </select>
          </div>

          {(statusFilter !== "all" || searchQuery) && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-card rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">
                  Date
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">
                  Name
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">
                  Email
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">
                  Message
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
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No leads found
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <>
                    <tr key={lead.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 text-sm">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-medium">{lead.name}</td>
                      <td className="px-6 py-4 text-sm">{lead.email}</td>
                      <td className="px-6 py-4 text-sm max-w-xs truncate">
                        {lead.message.length > 50
                          ? `${lead.message.slice(0, 50)}...`
                          : lead.message}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                          className={`px-2 py-1 rounded text-xs font-medium border-0 focus:ring-2 focus:ring-primary ${
                            lead.status === "new"
                              ? "bg-primary/20 text-primary"
                              : lead.status === "contacted"
                              ? "bg-warning/20 text-warning"
                              : "bg-success/20 text-success"
                          }`}
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt.charAt(0).toUpperCase() + opt.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() =>
                            setExpandedLead(expandedLead === lead.id ? null : lead.id)
                          }
                          className="text-primary text-sm hover:underline"
                        >
                          {expandedLead === lead.id ? "Hide" : "View"}
                        </button>
                      </td>
                    </tr>
                    {expandedLead === lead.id && (
                      <tr key={`${lead.id}-details`}>
                        <td colSpan={6} className="px-6 py-4 bg-muted/30">
                          <div className="space-y-4">
                            <div>
                              <div className="text-sm font-medium mb-1">Full Message:</div>
                              <div className="text-sm bg-background p-3 rounded-lg border border-border whitespace-pre-wrap">
                                {lead.message}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium mb-1">Admin Notes:</div>
                              {editingNotes === lead.id ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={notesValue}
                                    onChange={(e) => setNotesValue(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Add notes about this lead..."
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleSaveNotes(lead.id)}
                                      className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingNotes(null);
                                        setNotesValue("");
                                      }}
                                      className="px-3 py-1.5 text-sm bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-start gap-2">
                                  <div className="flex-1 text-sm bg-background p-3 rounded-lg border border-border">
                                    {lead.notes || (
                                      <span className="text-muted-foreground">No notes</span>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => {
                                      setEditingNotes(lead.id);
                                      setNotesValue(lead.notes || "");
                                    }}
                                    className="px-3 py-1.5 text-sm bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors"
                                  >
                                    Edit
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
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
              Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fetchLeads(pagination.page - 1, statusFilter, searchQuery)}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => fetchLeads(pagination.page + 1, statusFilter, searchQuery)}
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

export const getServerSideProps: GetServerSideProps<LeadsPageProps> = async (
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
    const [leads, totalCount, newCount, contactedCount, closedCount] = await Promise.all([
      prisma.contactSubmission.findMany({
        orderBy: { createdAt: "desc" },
        take: 25,
      }),
      prisma.contactSubmission.count(),
      prisma.contactSubmission.count({ where: { status: "new" } }),
      prisma.contactSubmission.count({ where: { status: "contacted" } }),
      prisma.contactSubmission.count({ where: { status: "closed" } }),
    ]);

    return {
      props: {
        leads: leads.map((lead) => ({
          ...lead,
          createdAt: lead.createdAt.toISOString(),
          updatedAt: lead.updatedAt.toISOString(),
        })),
        pagination: {
          page: 1,
          limit: 25,
          totalCount,
          totalPages: Math.ceil(totalCount / 25),
        },
        statusCounts: {
          all: totalCount,
          new: newCount,
          contacted: contactedCount,
          closed: closedCount,
        },
      },
    };
  } catch (error) {
    console.error("Leads error:", error);
    return {
      props: {
        leads: [],
        pagination: { page: 1, limit: 25, totalCount: 0, totalPages: 0 },
        statusCounts: { all: 0, new: 0, contacted: 0, closed: 0 },
      },
    };
  }
};
