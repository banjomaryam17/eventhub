export const dynamic = "force-dynamic";
"use client";

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
  const [stats, setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

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
      } catch (err: any) {
        setError(err.message ?? "Failed to fetch stats");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;

  if (error) return (
    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
      {error}
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Platform overview</h2>
        <p className="text-slate-400 text-sm">Live stats from your marketplace</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Total users</p>
          <p className="text-3xl font-bold text-white">{stats?.totalUsers}</p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Active listings</p>
          <p className="text-3xl font-bold text-indigo-400">{stats?.totalListings}</p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Total orders</p>
          <p className="text-3xl font-bold text-emerald-400">{stats?.totalOrders}</p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Total revenue</p>
          <p className="text-3xl font-bold text-amber-400">€{stats?.totalRevenue}</p>
        </div>
      </div>

      {/* Quick links */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Quick actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a href="/admin/users" className="bg-slate-800/60 border border-slate-700 hover:border-slate-500 rounded-2xl p-5 transition-colors group">
            <p className="text-2xl mb-3">👥</p>
            <p className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors">Manage users</p>
            <p className="text-xs text-slate-500 mt-1">View, promote or ban users</p>
          </a>
          <a href="/admin/listings" className="bg-slate-800/60 border border-slate-700 hover:border-slate-500 rounded-2xl p-5 transition-colors group">
            <p className="text-2xl mb-3">🛍</p>
            <p className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors">Manage listings</p>
            <p className="text-xs text-slate-500 mt-1">Review and remove listings</p>
          </a>
          <a href="/admin/orders" className="bg-slate-800/60 border border-slate-700 hover:border-slate-500 rounded-2xl p-5 transition-colors group">
            <p className="text-2xl mb-3">📦</p>
            <p className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors">Manage orders</p>
            <p className="text-xs text-slate-500 mt-1">View and update order status</p>
          </a>
        </div>
      </div>
    </div>
  );
}
