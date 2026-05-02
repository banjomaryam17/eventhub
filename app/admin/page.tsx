"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui";

interface Stats {
  totalUsers: number;
  totalListings: number;
  totalOrders: number;
  totalRevenue: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resetRequests, setResetRequests] = useState<any[]>([]);
  const [resettingId, setResettingId] = useState<number | null>(null);
  const [tempPasswords, setTempPasswords] = useState<Record<number, string>>(
    {},
  );

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/dashboard");
        if (res.status === 401 || res.status === 403) {
          router.push("/");
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setStats(data);

        const resetRes = await fetch("/api/admin/password-resets");
        if (resetRes.ok) {
          const resetData = await resetRes.json();
          setResetRequests(resetData.requests ?? []);
        }
      } catch (err: any) {
        setError(err.message ?? "Failed to fetch stats");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);
  if (loading) return <LoadingSpinner message="Loading dashboard..." />;

  if (error)
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
        {error}
      </div>
    );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Platform overview</h2>
        <p className="text-slate-400 text-sm">
          Live stats from your marketplace
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
            Total users
          </p>
          <p className="text-3xl font-bold text-white">{stats?.totalUsers}</p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
            Active listings
          </p>
          <p className="text-3xl font-bold text-indigo-400">
            {stats?.totalListings}
          </p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
            Total orders
          </p>
          <p className="text-3xl font-bold text-emerald-400">
            {stats?.totalOrders}
          </p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
            Total revenue
          </p>
          <p className="text-3xl font-bold text-amber-400">
            €{stats?.totalRevenue}
          </p>
        </div>
      </div>

      {/* Quick links */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-4">
          Quick actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a
            href="/admin/users"
            className="bg-slate-800/60 border border-slate-700 hover:border-slate-500 rounded-2xl p-5 transition-colors group"
          >
            <p className="text-2xl mb-3">👥</p>
            <p className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors">
              Manage users
            </p>
            <p className="text-xs text-slate-500 mt-1">
              View, promote or ban users
            </p>
          </a>
          <a
            href="/admin/listings"
            className="bg-slate-800/60 border border-slate-700 hover:border-slate-500 rounded-2xl p-5 transition-colors group"
          >
            <p className="text-2xl mb-3">🛍</p>
            <p className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors">
              Manage listings
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Review and remove listings
            </p>
          </a>
          <a
            href="/admin/orders"
            className="bg-slate-800/60 border border-slate-700 hover:border-slate-500 rounded-2xl p-5 transition-colors group"
          >
            <p className="text-2xl mb-3">📦</p>
            <p className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors">
              Manage orders
            </p>
            <p className="text-xs text-slate-500 mt-1">
              View and update order status
            </p>
          </a>
        </div>
      </div>
      {/* Password Reset Requests */}
      {resetRequests.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-4">
            🔑 Password reset requests ({resetRequests.length})
          </h3>
          <div className="flex flex-col gap-3">
            {resetRequests.map((req) => (
              <div
                key={req.id}
                className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-4"
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    @{req.username}
                  </p>
                  <p className="text-xs text-slate-400">{req.email}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Requested{" "}
                    {new Date(req.created_at).toLocaleDateString("en-IE")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {tempPasswords[req.id] ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                      <p className="text-xs text-slate-400">Temp password:</p>
                      <p className="text-sm font-mono font-bold text-emerald-400">
                        {tempPasswords[req.id]}
                      </p>
                    </div>
                  ) : (
                    <button
                      disabled={resettingId === req.id}
                      onClick={async () => {
                        setResettingId(req.id);
                        const res = await fetch("/api/admin/password-resets", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            request_id: req.id,
                            user_id: req.user_id,
                          }),
                        });
                        const data = await res.json();
                        if (res.ok) {
                          setTempPasswords((prev) => ({
                            ...prev,
                            [req.id]: data.temp_password,
                          }));

                          setTimeout(
                            () => {
                              setTempPasswords((prev) => {
                                const updated = { ...prev };
                                delete updated[req.id];
                                return updated;
                              });
                              setResetRequests((prev) =>
                                prev.filter((r) => r.id !== req.id),
                              );
                            },
                            5 * 60 * 1000,
                          ); // 5 minutes
                        }
                        setResettingId(null);
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-xl transition-colors disabled:opacity-50"
                    >
                      {resettingId === req.id
                        ? "Resetting..."
                        : "Reset password"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
