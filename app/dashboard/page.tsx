"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageLayout from "@/components/PageLayout";
import ConfirmModal from "@/components/ConfirmModal";

import { Card, Button, Badge, ConditionBadge, LoadingSpinner, EmptyState } from "@/components/ui";

interface Listing {
  id: number;
  title: string;
  price: string;
  quantity: number;
  condition: string;
  is_active: boolean;
  average_rating: string;
  review_count: number;
  created_at: string;
  category_name: string;
  primary_image: string | null;
}

interface SellerOrder {
  order_id: number;
  status: string;
  created_at: string;
  quantity: number;
  price_snapshot: string;
  title_snapshot: string;
  subtotal: string;
  listing_id: number;
  buyer_username: string;
  buyer_email: string;
  full_name: string | null;
  address_line1: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
}

interface SessionUser {
  userId: number;
  username: string;
  role: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending:    "bg-amber-400/10 text-amber-400 border-amber-400/20",
  processing: "bg-blue-400/10 text-blue-400 border-blue-400/20",
  shipped:    "bg-indigo-400/10 text-indigo-400 border-indigo-400/20",
  delivered:  "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
  cancelled:  "bg-red-400/10 text-red-400 border-red-400/20",
  refunded:   "bg-red-400/10 text-red-400 border-red-400/20",
};

export default function SellerDashboardPage() {
  const router = useRouter();
  const [user, setUser]               = useState<SessionUser | null>(null);
  const [listings, setListings]       = useState<Listing[]>([]);
  const [orders, setOrders]           = useState<SellerOrder[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [deleting, setDeleting]       = useState<number | null>(null);
  const [activeTab, setActiveTab]     = useState<"listings" | "sales">("listings");
  const [modal, setModal] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const sessionRes = await fetch("/api/auth/session");
        if (!sessionRes.ok) { router.push("/auth/login"); return; }
        const sessionData = await sessionRes.json();
        setUser(sessionData.user);

        // Fetch listings and seller orders in parallel
        const [listingsRes, ordersRes] = await Promise.all([
          fetch("/api/listings?limit=48"),
          fetch("/api/seller/orders"),
        ]);

        const listingsData = await listingsRes.json();
        const myListings = listingsData.listings.filter(
          (l: any) =>
            l.seller_id === sessionData.user.userId ||
            (l.seller_id === null && l.is_anonymous)
        );
        setListings(myListings);

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setOrders(ordersData.orders);
        }
      } catch {
        setError("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  function handleDelete(listingId: number) {
  setModal({
    title: "Remove listing",
    message: "Are you sure you want to remove this listing? This cannot be undone.",
    confirmLabel: "Remove",
    variant: "danger",
    onConfirm: () => actuallyDelete(listingId),
  });
}

async function actuallyDelete(listingId: number) {
  setDeleting(listingId);
  const res = await fetch(`/api/listings/${listingId}`, { method: "DELETE" });
  if (res.ok) setListings((prev) => prev.filter((l) => l.id !== listingId));
  setDeleting(null);
}

  const activeListings   = listings.filter((l) => l.is_active);
  const inactiveListings = listings.filter((l) => !l.is_active);
  const totalEarnings    = orders.reduce((sum, o) => sum + parseFloat(o.subtotal), 0);

  return (
    <PageLayout
      title="Seller dashboard"
      subtitle={user ? `Welcome back, ${user.username}` : ""}
    >
      {loading && <LoadingSpinner message="Loading your dashboard..." />}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm mb-6">
          {error}
        </div>
      )}

      {!loading && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <Card padding="sm" className="text-center">
              <p className="text-2xl font-bold text-white">{listings.length}</p>
              <p className="text-xs text-slate-500 mt-1">Total listings</p>
            </Card>
            <Card padding="sm" className="text-center">
              <p className="text-2xl font-bold text-emerald-400">{activeListings.length}</p>
              <p className="text-xs text-slate-500 mt-1">Active</p>
            </Card>
            <Card padding="sm" className="text-center">
              <p className="text-2xl font-bold text-indigo-400">{orders.length}</p>
              <p className="text-xs text-slate-500 mt-1">Total sales</p>
            </Card>
            <Card padding="sm" className="text-center">
              <p className="text-2xl font-bold text-amber-400">€{totalEarnings.toFixed(0)}</p>
              <p className="text-xs text-slate-500 mt-1">Total earned</p>
            </Card>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mb-6 border-b border-slate-800">
            <button
              onClick={() => setActiveTab("listings")}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === "listings"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              My listings ({listings.length})
            </button>
            <button
              onClick={() => setActiveTab("sales")}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === "sales"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              Sales ({orders.length})
            </button>
          </div>

          {/* ── Listings Tab  */}
          {activeTab === "listings" && (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-400">{activeListings.length} active listings</p>
                <Button href="/sell/new" size="sm">+ New listing</Button>
              </div>

              {listings.length === 0 ? (
                <EmptyState
                  icon="🏪"
                  title="No listings yet"
                  description="Create your first listing and start selling"
                  action={{ label: "Create listing", href: "/sell/new" }}
                />
              ) : (
                <div className="flex flex-col gap-4">
                  {listings.map((listing) => (
                    <Card key={listing.id} padding="sm">
                      <div className="flex gap-4 items-start">
                        <Link href={`/listings/${listing.id}`} className="flex-shrink-0">
                          <div className="w-20 h-20 bg-slate-800 rounded-xl overflow-hidden">
                            {listing.primary_image ? (
                              <img src={listing.primary_image} alt={listing.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-2xl opacity-20">🛍</span>
                              </div>
                            )}
                          </div>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <Link href={`/listings/${listing.id}`} className="hover:text-indigo-400 transition-colors">
                                <h3 className="text-sm font-semibold text-white line-clamp-1">{listing.title}</h3>
                              </Link>
                              <p className="text-xs text-slate-500 mt-0.5">{listing.category_name}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <ConditionBadge condition={listing.condition} />
                              {!listing.is_active && <Badge variant="danger">Inactive</Badge>}
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                            <div className="flex items-center gap-4">
                              <span className="text-base font-bold text-white">€{parseFloat(listing.price).toFixed(2)}</span>
                              <span className="text-xs text-slate-500">{listing.quantity} in stock</span>
                              <span className="text-xs text-slate-500">⭐ {parseFloat(listing.average_rating).toFixed(1)} ({listing.review_count})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button href={`/sell/edit/${listing.id}`} variant="secondary" size="sm">Edit</Button>
                              <Button
                                variant="danger"
                                size="sm"
                                disabled={deleting === listing.id}
                                onClick={() => handleDelete(listing.id)}
                              >
                                {deleting === listing.id ? "Removing..." : "Remove"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {/*Sales Tab*/}
          {activeTab === "sales" && (
            <>
              {orders.length === 0 ? (
                <EmptyState
                  icon="💰"
                  title="No sales yet"
                  description="When someone buys your listing it will appear here"
                />
              ) : (
                <div className="flex flex-col gap-4">
                  {orders.map((order) => (
                    <Card key={`${order.order_id}-${order.listing_id}`} padding="sm">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">
                              Order #{order.order_id}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[order.status] ?? "bg-slate-700 text-slate-300"}`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-sm text-white mt-1">{order.title_snapshot}</p>
                          <p className="text-xs text-slate-500">
                            Qty: {order.quantity} · €{parseFloat(order.subtotal).toFixed(2)}
                          </p>
                          <div className="mt-2 p-3 bg-slate-800/60 rounded-xl">
                            <p className="text-xs font-medium text-slate-300 mb-1">Buyer details</p>
                            <p className="text-xs text-slate-400">@{order.buyer_username} — {order.buyer_email}</p>
                            {order.full_name && (
                              <p className="text-xs text-slate-400 mt-1">
                                📦 {order.full_name}, {order.address_line1}, {order.city}, {order.postal_code}, {order.country}
                              </p>
                            )}
                            {!order.full_name && (
                              <p className="text-xs text-slate-500 mt-1">No shipping address provided</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-white">€{parseFloat(order.subtotal).toFixed(2)}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(order.created_at).toLocaleDateString("en-IE")}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
      <ConfirmModal config={modal} onClose={() => setModal(null)} />
    </PageLayout>
  );
}
