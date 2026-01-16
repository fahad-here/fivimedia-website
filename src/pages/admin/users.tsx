import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { useState, useRef, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { authOptions } from "../api/auth/[...nextauth]";
import prisma from "@/lib/prisma";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
}

interface UsersPageProps {
  users: User[];
  currentUserEmail: string;
}

export default function UsersPage({ users: initialUsers, currentUserEmail }: UsersPageProps) {
  const [users, setUsers] = useState(initialUsers);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [formError, setFormError] = useState("");
  const messageRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // New user form
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    name: "",
    password: "",
    confirmPassword: "",
  });

  // Edit user
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    newPassword: "",
  });

  useEffect(() => {
    if (showNewUserForm && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [showNewUserForm]);

  const showGlobalMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    if (messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleAddUser = async () => {
    if (!newUser.email) {
      setFormError("Email is required");
      return;
    }
    if (!newUser.password) {
      setFormError("Password is required");
      return;
    }
    if (newUser.password.length < 6) {
      setFormError("Password must be at least 6 characters");
      return;
    }
    if (newUser.password !== newUser.confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newUser.email,
          name: newUser.name,
          password: newUser.password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setUsers((prev) => [...prev, data.user]);
        setNewUser({ email: "", name: "", password: "", confirmPassword: "" });
        setShowNewUserForm(false);
        showGlobalMessage("User created successfully", "success");
      } else {
        setFormError(data.error || "Failed to create user");
      }
    } catch {
      setFormError("Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUser = async (userId: string) => {
    setSaving(true);

    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userId,
          name: editForm.name,
          newPassword: editForm.newPassword || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, name: editForm.name } : u
          )
        );
        setEditingUser(null);
        setEditForm({ name: "", newPassword: "" });
        showGlobalMessage("User updated successfully", "success");
      } else {
        showGlobalMessage(data.error || "Failed to update user", "error");
      }
    } catch {
      showGlobalMessage("Failed to update user", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (userEmail === currentUserEmail) {
      showGlobalMessage("You cannot delete your own account", "error");
      return;
    }

    if (!confirm(`Are you sure you want to delete ${userEmail}?`)) {
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId }),
      });

      const data = await response.json();

      if (data.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        showGlobalMessage("User deleted successfully", "success");
      } else {
        showGlobalMessage(data.error || "Failed to delete user", "error");
      }
    } catch {
      showGlobalMessage("Failed to delete user", "error");
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (user: User) => {
    setEditingUser(user.id);
    setEditForm({ name: user.name || "", newPassword: "" });
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button
          onClick={() => setShowNewUserForm(!showNewUserForm)}
          className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
        >
          {showNewUserForm ? "Cancel" : "+ Add User"}
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

      {/* Add User Form */}
      {showNewUserForm && (
        <div ref={formRef} className="bg-card rounded-xl border border-border mb-8">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold">Add New Admin User</h2>
          </div>
          <div className="p-6">
            {formError && (
              <div className="mb-4 p-3 bg-error/10 text-error rounded-lg text-sm">
                {formError}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Email <span className="text-error">*</span>
                </label>
                <input
                  type="email"
                  placeholder="admin@example.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Password <span className="text-error">*</span>
                </label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Confirm Password <span className="text-error">*</span>
                </label>
                <input
                  type="password"
                  placeholder="Repeat password"
                  value={newUser.confirmPassword}
                  onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="md:col-span-2">
                <button
                  onClick={handleAddUser}
                  disabled={saving}
                  className="px-4 py-2 bg-success text-white rounded-lg font-medium hover:bg-success/90 transition-colors disabled:opacity-50"
                >
                  Create User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold">Admin Users</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {users.length} user{users.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <div className="divide-y divide-border">
          {users.map((user) => (
            <div key={user.id} className="p-6">
              {editingUser === user.id ? (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4 max-w-xl">
                    <div>
                      <label className="block text-sm font-medium mb-1">Name</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        New Password <span className="text-muted-foreground text-xs">(leave blank to keep)</span>
                      </label>
                      <input
                        type="password"
                        placeholder="New password"
                        value={editForm.newPassword}
                        onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateUser(user.id)}
                      disabled={saving}
                      className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingUser(null);
                        setEditForm({ name: "", newPassword: "" });
                      }}
                      className="px-4 py-2 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{user.email}</span>
                      {user.email === currentUserEmail && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">You</span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {user.name || "No name"} · {user.role} · Created{" "}
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEditing(user)}
                      className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                    {user.email !== currentUserEmail && (
                      <button
                        onClick={() => handleDeleteUser(user.id, user.email)}
                        disabled={saving}
                        className="px-3 py-1.5 text-sm bg-error/10 text-error hover:bg-error/20 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps<UsersPageProps> = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: "/admin/login",
        permanent: false,
      },
    };
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  return {
    props: {
      users: users.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
      })),
      currentUserEmail: session.user?.email || "",
    },
  };
};
