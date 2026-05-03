"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PageLayout from "@/components/PageLayout";
import { Card, StatusBadge, LoadingSpinner } from "@/components/ui";

export default function OrderPage() {
  const params = useParams();
  const [order, setOrder]   = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${params.id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setOrder(data.order);
      } catch (err: any) {
        setError(err.message ?? "Failed to fetch order");
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [params.id]);

  function getDeliveryInfo(status: string, createdAt: string) {
    const orderDate = new Date(createdAt);
    const dispatchDate = new Date(orderDate);
    dispatchDate.setDate(dispatchDate.getDate() + 2);
    const deliveryDate = new Date(orderDate);
    deliveryDate.setDate(deliveryDate.getDate() + 7);

    const format = (d: Date) => d.toLocaleDateString("en-IE", {
      day: "numeric", month: "long"
    });

    switch (status) {
      case "pending":
        return {
          icon: "🕐",
          title: "Awaiting seller confirmation",
          message: `The seller will confirm your order shortly. Expected dispatch by ${format(dispatchDate)}.`,
          color: "border-amber-500/20 bg-amber-500/5",
          textColor: "text-amber-400",
        };
      case "processing":
        return {
          icon: "📦",
          title: "Order is being prepared",
          message: `The seller is preparing your order. Expected dispatch by ${format(dispatchDate)}.`,
          color: "border-blue-500/20 bg-blue-500/5",
          textColor: "text-blue-400",
        };
      case "shipped":
        return {
          icon: "🚚",
          title: "Your order is on its way!",
          message: `Estimated delivery by ${format(deliveryDate)}. Usually 3-5 business days after dispatch.`,
          color: "border-indigo-500/20 bg-indigo-500/5",
          textColor: "text-indigo-400",
        };
      case "delivered":
        return {
          icon: "✅",
          title: "Order delivered",
          message: "Your order has been delivered. Enjoy your purchase!",
          color: "border-emerald-500/20 bg-emerald-500/5",
          textColor: "text-emerald-400",
        };
      case "cancelled":
        return {
          icon: "❌",
          title: "Order cancelled",
          message: "This order has been cancelled. You have not been charged.",
          color: "border-red-500/20 bg-red-500/5",
          textColor: "text-red-400",
        };
      default:
        return null;
    }
  }

  if (loading) return <PageLayout><LoadingSpinner message="Loading order..." /></PageLayout>;

  if (error) return (
    <PageLayout>
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
        {error}
      </div>
    </PageLayout>
  );

  const deliveryInfo = getDeliveryInfo(order.status, order.created_at);

  return (
    <PageLayout title={`Order #${order.id}`} showBack backHref="/orders">
      <div className="max-w-2xl flex flex-col gap-6">

        {/* Order info */}
        <Card>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Status</p>
              <StatusBadge status={order.status} />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Date</p>
              <p className="text-sm text-white">
                {new Date(order.created_at).toLocaleDateString("en-IE", {
                  day: "numeric", month: "long", year: "numeric"
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Total</p>
              <p className="text-lg font-bold text-white">€{parseFloat(order.total_price).toFixed(2)}</p>
            </div>
          </div>
        </Card>

        {/* Delivery estimate */}
        {deliveryInfo && (
          <div className={`border rounded-xl p-4 ${deliveryInfo.color}`}>
            <div className="flex items-start gap-3">
              <span className="text-xl">{deliveryInfo.icon}</span>
              <div>
                <p className={`text-sm font-semibold ${deliveryInfo.textColor}`}>
                  {deliveryInfo.title}
                </p>
                <p className="text-xs text-slate-400 mt-1">{deliveryInfo.message}</p>
                {order.status === "shipped" && (
                  <ul className="text-xs text-slate-500 mt-2 flex flex-col gap-1">
                    <li>📬 Check back here to track your order status</li>
                    <li>✉️ Contact the seller if you have any questions</li>
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Items */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Items</h2>
          <div className="flex flex-col gap-3">
            {order.items.map((item: any) => (
              <Link href={`/listings/${item.listing_id}`} key={item.id}>
                <Card padding="sm" className="cursor-pointer hover:border-indigo-500 transition-colors">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-slate-800 rounded-xl overflow-hidden flex-shrink-0">
                      {item.primary_image ? (
                        <img src={item.primary_image} alt={item.title_snapshot} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-2xl opacity-20">🛍</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white hover:text-indigo-400 transition-colors line-clamp-2">
                        {item.title_snapshot}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        €{parseFloat(item.price_snapshot).toFixed(2)} × {item.quantity}
                      </p>
                      <p className="text-sm font-semibold text-white mt-1">
                        €{(parseFloat(item.price_snapshot) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </PageLayout>
  );
}