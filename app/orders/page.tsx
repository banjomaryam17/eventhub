export const dynamic = "force-dynamic";
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageLayout from "@/components/PageLayout";
import { Card, StatusBadge, LoadingSpinner, EmptyState } from "@/components/ui";

interface Order {
  id: number;
  total_price: string;
  status: string;
  created_at: string;
  item_count: number;
  stripe_payment_intent_id: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch("/api/orders");
        if (res.status === 401) {
          router.push("/auth/login");
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setOrders(data.orders);
      } catch (err: any) {
        setError(err.message ?? "Failed to load orders");
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  return (
    <PageLayout
      title="Your orders"
      subtitle="All your past purchases"
    >
      {loading && <LoadingSpinner message="Loading your orders..." />}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <EmptyState
          icon="📦"
          title="No orders yet"
          description="When you purchase something it will appear here"
          action={{ label: "Browse listings", href: "/listings" }}
        />
      )}

      {!loading && orders.length > 0 && (
        <div className="flex flex-col gap-4 max-w-3xl">
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <Card hover className="flex items-center justify-between gap-4 flex-wrap">
                {/* Left — order info */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      Order #{order.id}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="text-xs text-slate-500">
                    {new Date(order.created_at).toLocaleDateString("en-IE", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    {" · "}
                    {order.item_count} item{order.item_count !== 1 ? "s" : ""}
                  </p>
                </div>

                {/* Right — total */}
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-white">
                    €{parseFloat(order.total_price).toFixed(2)}
                  </span>
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
