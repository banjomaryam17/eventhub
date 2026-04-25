export const dynamic = "force-dynamic";
import PageLayout from "@/components/PageLayout";
import Link from "next/link";

async function getOrders() {
  const res = await fetch("http://localhost:3000/api/orders", {
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Failed to fetch orders");

  return res.json();
}

export default async function OrderHistoryPage() {
  const data = await getOrders();

  return (
    <PageLayout title="Your Orders">
      {data.orders.length === 0 ? (
        <p className="text-slate-400">You haven’t placed any orders yet.</p>
      ) : (
        <div className="space-y-4">
          {data.orders.map((order: any) => (
            <Link href={`/orders/${order.id}`} key={order.id}>
              <div className="bg-slate-900 p-5 rounded-xl flex justify-between items-center hover:bg-slate-800 transition">
                
                <div>
                  <p className="font-semibold">Order #{order.id}</p>
                  <p className="text-sm text-slate-400">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-slate-500">
                    {order.item_count} items
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold">€{order.total_price}</p>
                  <p className="text-sm capitalize text-slate-400">
                    {order.status}
                  </p>
                </div>

              </div>
            </Link>
          ))}
        </div>
      )}
    </PageLayout>
  );
}