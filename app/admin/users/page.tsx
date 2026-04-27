"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { LoadingSpinner, EmptyState } from "@/components/ui";
import ConfirmModal from "@/components/ConfirmModal";

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  is_banned: boolean;
  created_at: string;
  listing_count: number;
  order_count: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<number | null>(null);
  const [modal, setModal] = useState<any>(null);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setUsers(data.users);
    } catch (err: any) {
      setError(err.message ?? "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  function handleRoleChange(userId: number, newRole: string) {
    setModal({
      title: "Change user role",
      message: `Are you sure you want to change this user's role to "${newRole}"?`,
      confirmLabel: "Change role",
      variant: "warning",
      onConfirm: () => actuallyChangeRole(userId, newRole),
    });
  }

  async function actuallyChangeRole(userId: number, newRole: string) {
    setUpdating(userId);
    setError("");

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, role: data.user.role } : u
        )
      );
    } catch (err: any) {
      setError(err.message ?? "Failed to update user");
    } finally {
      setUpdating(null);
    }
  }

  function handleBanToggle(userId: number, shouldBan: boolean) {
    setModal({
      title: shouldBan ? "Ban user" : "Unban user",
      message: shouldBan
        ? "Are you sure you want to ban this user? They will be blocked from protected areas of the site."
        : "Are you sure you want to unban this user?",
      confirmLabel: shouldBan ? "Ban user" : "Unban user",
      variant: shouldBan ? "danger" : "warning",
      onConfirm: () => actuallyToggleBan(userId, shouldBan),
    });
  }

  async function actuallyToggleBan(userId: number, shouldBan: boolean) {
    setUpdating(userId);
    setError("");

    try {
      const res = await fetch("/api/admin/ban_user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          banned: shouldBan,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, is_banned: data.user.is_banned } : u
        )
      );
    } catch (err: any) {
      setError(err.message ?? "Failed to update ban status");
    } finally {
      setUpdating(null);
    }
  }

  if (loading) return <LoadingSpinner message="Loading users..." />;

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-6">
        Manage Users
        <span className="text-slate-500 font-normal text-base ml-2">
          ({users.length})
        </span>
      </h2>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm mb-6">
          {error}
        </div>
      )}

      {users.length === 0 ? (
        <EmptyState icon="👥" title="No users found" />
      ) : (
        <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-800 text-slate-400">
              <tr>
                <th className="text-left p-3">Username</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Role</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Joined</th>
                <th className="text-left p-3">Listings</th>
                <th className="text-left p-3">Orders</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-t border-slate-800 hover:bg-slate-800/40"
                >
                  <td className="p-3 font-medium text-white">
                    @{user.username}
                  </td>

                  <td className="p-3 text-slate-400">{user.email}</td>

                  <td className="p-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        user.role === "admin"
                          ? "bg-amber-400/10 text-amber-400"
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>

                  <td className="p-3">
                    {user.is_banned ? (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-400/10 text-red-400">
                        Banned
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-400/10 text-emerald-400">
                        Active
                      </span>
                    )}
                  </td>

                  <td className="p-3 text-slate-400">
                    {new Date(user.created_at).toLocaleDateString("en-IE")}
                  </td>

                  <td className="p-3 text-slate-400">{user.listing_count}</td>
                  <td className="p-3 text-slate-400">{user.order_count}</td>

                  <td className="p-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() =>
                          handleRoleChange(
                            user.id,
                            user.role === "admin" ? "user" : "admin"
                          )
                        }
                        disabled={updating === user.id}
                        className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-600/30 px-3 py-1 rounded-lg text-xs transition-colors disabled:opacity-30"
                      >
                        {updating === user.id
                          ? "Updating..."
                          : user.role === "admin"
                          ? "Make user"
                          : "Make admin"}
                      </button>

                      <button
                        onClick={() =>
                          handleBanToggle(user.id, !user.is_banned)
                        }
                        disabled={updating === user.id}
                        className={
                          user.is_banned
                            ? "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-600/30 px-3 py-1 rounded-lg text-xs transition-colors disabled:opacity-30"
                            : "bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 px-3 py-1 rounded-lg text-xs transition-colors disabled:opacity-30"
                        }
                      >
                        {updating === user.id
                          ? "Updating..."
                          : user.is_banned
                          ? "Unban"
                          : "Ban"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal config={modal} onClose={() => setModal(null)} />
    </div>
  );
}