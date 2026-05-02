"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/PageLayout";
import { Button, Card, LoadingSpinner, EmptyState } from "@/components/ui";
import ConfirmModal from "@/components/ConfirmModal";
import Link from "next/link";

interface CartItem {
  listing_id: number;
  title: string;
  price: string;
  cart_quantity: number;
  stock_quantity: number;
  condition: string;
  is_active: boolean;
  seller_username: string;
  primary_image: string | null;
}

interface CartSummary {
  item_count: number;
  subtotal: number;
  discount: number;
  total: number;
  discount_percent: number;
  discount_code: string | null;
}

export default function CartPage() {
  const router = useRouter();
  const [items, setItems]       = useState<CartItem[]>([]);
  const [summary, setSummary]   = useState<CartSummary | null>(null);
  const [loading, setLoading]   = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [error, setError]       = useState("");
  const [modal, setModal]       =useState<any>(null);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedCode, setAppliedCode] = useState("");

  async function fetchCart() {
    try {
      const res = await fetch(`/api/cart?discount=${appliedCode}`);
      if (res.status === 401) {
        router.push("/auth/login");
        return;
      }
      const data = await res.json();
      setItems(data.items ?? []);
      setSummary(data.summary ?? null);
    } catch {
      setError("Failed to load cart");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCart(); }, [appliedCode]);

  async function updateQuantity(listingId: number, newQty: number) {
  setUpdating(listingId);

  try {
    const res = await fetch(`/api/cart/${listingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: newQty }),
    });

    if (res.ok) {
      await fetchCart(); // Let server be the source of truth
    } else {
      const data = await res.json();
      setError(data.error);
      await fetchCart();
    }
  } catch {
    setError("Failed to update item");
    await fetchCart();
  } finally {
    setUpdating(null);
  }
}
function removeItem(listingId: number) {
  setModal({
    title: "Remove item",
    message: "Are you sure you want to remove this item from your cart?",
    confirmLabel: "Remove",
    variant: "danger",
    onConfirm: () => actuallyRemoveItem(listingId),
  });
}

async function actuallyRemoveItem(listingId: number) {
  setUpdating(listingId);
  try {
    const res = await fetch(`/api/cart/${listingId}`, { method: "DELETE" });
    if (res.ok) await fetchCart();
  } catch {
    setError("Failed to remove item");
  } finally {
    setUpdating(null);
  }
}

  if (loading) return (
    <PageLayout title="Your cart">
      <LoadingSpinner message="Loading your cart..." />
    </PageLayout>
  );

  return (
    <PageLayout title="Your cart" subtitle={summary ? `${summary.item_count} item${summary.item_count !== 1 ? "s" : ""}` : ""}>
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm mb-6">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon="🛒"
          title="Your cart is empty"
          description="Browse listings and add items to your cart"
          action={{ label: "Browse listings", href: "/listings" }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Cart Items */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {items.map((item) => (
              <Card key={item.listing_id} padding="sm">
                <div className="flex gap-4">
                  {/* Image */}
                  <Link href={`/listings/${item.listing_id}`} className="flex-shrink-0">
                    <div className="w-24 h-24 bg-slate-800 rounded-xl overflow-hidden">
                      {item.primary_image ? (
                        <img src={item.primary_image} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-3xl opacity-20">🛍</span>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/listings/${item.listing_id}`} className="hover:text-indigo-400 transition-colors">
                      <h3 className="text-sm font-semibold text-white line-clamp-2">{item.title}</h3>
                    </Link>
                    <p className="text-xs text-slate-500 mt-0.5">@{item.seller_username}</p>

                    {!item.is_active && (
                      <p className="text-xs text-red-400 mt-1">⚠ This item is no longer available</p>
                    )}

                    <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                      {/* Quantity controls */}
                      <div className="flex items-center border border-slate-700 rounded-xl overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.listing_id, item.cart_quantity - 1)}
                          disabled={updating === item.listing_id || item.cart_quantity <= 1}
                          className="px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-30"
                        >
                          −
                        </button>
                        <span className="px-3 py-1.5 text-white text-sm border-x border-slate-700 min-w-[2.5rem] text-center">
                          {updating === item.listing_id ? "..." : item.cart_quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.listing_id, item.cart_quantity + 1)}
                          disabled={updating === item.listing_id || item.cart_quantity >= item.stock_quantity}
                          className="px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-base font-bold text-white">
                          €{(parseFloat(item.price) * item.cart_quantity).toFixed(2)}
                        </span>
                        <button
                          onClick={() => removeItem(item.listing_id)}
                          disabled={updating === item.listing_id}
                          className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <h2 className="text-lg font-bold text-white mb-5">Order summary</h2>

              {/* Discount input */}
              <div className="flex gap-2 mb-2">
                <input
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  placeholder="Discount code"
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                />
                <button
                  onClick={() => {
                    setAppliedCode(discountCode);
                    setDiscountCode("");
                  }}
                  className="px-4 py-2 bg-indigo-600 rounded-lg text-white text-sm hover:bg-indigo-500 transition-colors"
                >
                  Apply
                </button>
              </div>

              {/* Applied code feedback */}
              {summary?.discount_code && (
                <p className="text-xs text-emerald-400 mb-3">
                  Code "{summary.discount_code}" applied ({summary.discount_percent}% off)
                </p>
              )}

              <div className="flex flex-col gap-3 mb-5">
                
                {/* Subtotal */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">
                    Subtotal ({summary?.item_count} item{summary?.item_count !== 1 ? "s" : ""})
                  </span>
                  <span className="text-white font-medium">
                    €{summary?.subtotal.toFixed(2)}
                  </span>
                </div>

                {/* Discount */}
                {summary && summary.discount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-emerald-400">
                      Discount ({summary.discount_percent}%)
                    </span>
                    <span className="text-emerald-400">
                      -€{summary.discount.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Shipping */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Shipping</span>
                  <span className="text-slate-400">Calculated at checkout</span>
                </div>

                {/* Total */}
                <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
                  <span className="font-semibold text-white">Total</span>
                  <span className="font-bold text-xl text-white">
                    €{summary?.total.toFixed(2)}
                  </span>
                </div>
              </div>

              <Button
  href={`/checkout${summary?.discount_code ? `?discount=${summary.discount_code}` : ""}`}
  size="lg"
  fullWidth
  disabled={items.some((i) => !i.is_active)}
>
  Proceed to checkout →
</Button>
              {items.some((i) => !i.is_active) && (
                <p className="text-xs text-red-400 text-center mt-3">
                  Remove unavailable items before checking out
                </p>
              )}

              <Button
                href="/listings"
                variant="ghost"
                size="sm"
                fullWidth
                className="mt-3"
              >
                ← Continue shopping
              </Button>
            </Card>
          </div>
        </div>
      )}
         <ConfirmModal config={modal} onClose={() => setModal(null)} />
    </PageLayout>
  );
}
