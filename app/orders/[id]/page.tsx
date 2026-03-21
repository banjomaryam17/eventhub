import PageLayout from "@/components/PageLayout";

async function getOrder(id: string) {
  const res = await fetch(`http://localhost:3000/api/orders/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Failed to fetch order");

  return res.json();
}

export default async function OrderPage({ params }: any) {
  const data = await getOrder(params.id);
  const order = data.order;

  return (
    <PageLayout title={`Order #${order.id}`} showBack>
      <div className="space-y-6">

        {/* Order Info */}
        <div className="bg-slate-900 p-5 rounded-xl">
          <p className="text-sm text-slate-400">Status</p>
          <p className="font-semibold capitalize">{order.status}</p>

          <p className="text-sm text-slate-400 mt-3">Date</p>
          <p>{new Date(order.created_at).toLocaleString()}</p>
        </div>

        {/* Items */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Items</h2>

          <div className="space-y-4">
            {order.items.map((item: any) => (
              <div
                key={item.id}
                className="bg-slate-900 p-4 rounded-lg flex gap-4"
              >
                {item.primary_image && (
                  <img
                    src={item.primary_image}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}

                <div>
                  <p className="font-medium">{item.title_snapshot}</p>
                  <p className="text-sm text-slate-400">
                    €{item.price_snapshot} × {item.quantity}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </PageLayout>
  );
}