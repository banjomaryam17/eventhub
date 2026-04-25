"use client";

import { useEffect, useState } from "react";
import { LoadingSpinner, EmptyState, StatusBadge } from "@/components/ui";

interface Order {
  id: number;
  total_price: string;
  status: string;
  created_at: string;
  item_count: number;
  buyer_username: string;
  buyer_email: string;
  stripe_payment_intent_id: string;
}

const VALID_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"];

export default function AdminOrdersPage() {
  const [orders, setOrders]     = useState<Order[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [updating, setUpdating] = useState<number | null>(null);

  async function fetchOrders() {
    try {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrders(data.orders);
    } catch (err: any) {
      setError(err.message ?? "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchOrders(); }, []);

  async function handleStatusChange(orderId: number, newStatus: string) {
    setUpdating(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err: any) {
      setError(err.message ?? "Failed to update order");
    } finally {
      setUpdating(null);
    }
  }

  if (loading) return <LoadingSpinner message="Loading orders..." />;

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-6">
        Manage Orders
        <span className="text-slate-500 font-normal text-base ml-2">({orders.length})</span>
      </h2>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm mb-6">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <EmptyState icon="📦" title="No orders yet" />
      ) : (
        <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800 text-slate-400">
                <tr>
                  <th className="text-left p-3">Order</th>
                  <th className="text-left p-3">Buyer</th>
                  <th className="text-left p-3">Items</th>
                  <th className="text-left p-3">Total</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Update</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-slate-800 hover:bg-slate-800/40">
                    <td className="p-3 font-medium text-white">#{order.id}</td>
                    <td className="p-3">
                      <p className="text-white">@{order.buyer_username}</p>
                      <p className="text-xs text-slate-500">{order.buyer_email}</p>
                    </td>
                    <td className="p-3 text-slate-400">{order.item_count}</td>
                    <td className="p-3 font-semibold text-white">
                      €{parseFloat(order.total_price).toFixed(2)}
                    </td>
                    <td className="p-3 text-slate-400">
                      {new Date(order.created_at).toLocaleDateString("en-IE")}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="p-3">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        disabled={updating === order.id}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {VALID_STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
