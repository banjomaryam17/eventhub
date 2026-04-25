"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageLayout from "@/components/PageLayout";
import { Card, Button, LoadingSpinner, EmptyState } from "@/components/ui";

interface UserProfile {
  userId: number;
  username: string;
  role: string;
}

interface Listing {
  id: number;
  title: string;
  price: string;
  condition: string;
  is_active: boolean;
  average_rating: string;
  review_count: number;
  primary_image: string | null;
  category_name: string;
}

interface SellerReputation {
  score: number;
  total_sales: number;
  is_verified_seller: boolean;
  tier: string;
}

interface BuyerReputation {
  score: number;
  total_purchases: number;
  tier: string;
}

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [sellerReputation, setSellerReputation] = useState<SellerReputation | null>(null);
  const [buyerReputation, setBuyerReputation] = useState<BuyerReputation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const sessionRes = await fetch("/api/auth/session");
        if (!sessionRes.ok) {
          router.push("/auth/login");
          return;
        }

        const sessionData = await sessionRes.json();
        setUser(sessionData.user);

        const userRes = await fetch(`/api/users/${sessionData.user.userId}`);
        if (!userRes.ok) {
          throw new Error("Failed to load user profile");
        }

        const userData = await userRes.json();

        setSellerReputation(userData.user.seller_reputation);
        setBuyerReputation(userData.user.buyer_reputation);

        const listingsRes = await fetch("/api/listings?limit=48");
        const listingsData = await listingsRes.json();

        const myListings = (listingsData.listings ?? []).filter(
          (l: any) => l.seller_id === sessionData.user.userId
        );

        setListings(myListings);
      } catch {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <PageLayout title="Profile">
        <LoadingSpinner message="Loading profile..." />
      </PageLayout>
    );
  }

  return (
    <PageLayout title="My Profile">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm mb-6">
          {error}
        </div>
      )}

      <div className="max-w-4xl flex flex-col gap-6">
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-indigo-400">
                {user?.username[0].toUpperCase()}
              </span>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-white">{user?.username}</h2>

                {sellerReputation?.is_verified_seller && (
                  <span className="text-xs bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 px-2 py-0.5 rounded-full">
                    ✓ Verified Seller
                  </span>
                )}

                {user?.role.toLowerCase() === "admin" && (
                  <span className="text-xs bg-amber-400/10 text-amber-400 border border-amber-400/20 px-2 py-0.5 rounded-full">
                    Admin
                  </span>
                )}
              </div>

              <p className="text-slate-400 text-sm mt-1">
                {listings.length} listing{listings.length !== 1 ? "s" : ""} ·{" "}
                {sellerReputation?.total_sales ?? 0} sales ·{" "}
                {buyerReputation?.total_purchases ?? 0} purchases
              </p>
            </div>

            <Button href="/dashboard" variant="secondary" size="sm">
              Manage listings
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold text-white">{listings.length}</p>
            <p className="text-xs text-slate-500 mt-1">Listings</p>
          </Card>

          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold text-indigo-400">
              {sellerReputation?.total_sales ?? 0}
            </p>
            <p className="text-xs text-slate-500 mt-1">Sales</p>
          </Card>

          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold text-amber-400">
              {sellerReputation?.score ?? 100}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Seller Score · {sellerReputation?.tier ?? "Trusted"}
            </p>
          </Card>

          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold text-emerald-400">
              {buyerReputation?.score ?? 100}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Buyer Score · {buyerReputation?.tier ?? "Trusted"}
            </p>
          </Card>
        </div>

        <Card>
          <h3 className="text-lg font-bold text-white mb-4">Trust status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl border border-slate-800 p-4">
              <p className="text-slate-400 mb-1">Seller</p>
              <p className="text-white font-semibold">
                {sellerReputation?.score ?? 100}/100 · {sellerReputation?.tier ?? "Trusted"}
              </p>
              <p className="text-slate-500 mt-2">
                Based on verified buyer reviews and successful delivered sales.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 p-4">
              <p className="text-slate-400 mb-1">Buyer</p>
              <p className="text-white font-semibold">
                {buyerReputation?.score ?? 100}/100 · {buyerReputation?.tier ?? "Trusted"}
              </p>
              <p className="text-slate-500 mt-2">
                Based on completed order history and buyer reliability.
              </p>
            </div>
          </div>
        </Card>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">My listings</h3>
            <Button href="/sell/new" size="sm">+ New listing</Button>
          </div>

          {listings.filter((l) => l.is_active).length === 0 ? (
            <EmptyState
              icon="🏪"
              title="No active listings"
              description="Create a listing to start selling"
              action={{ label: "Create listing", href: "/sell/new" }}
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {listings.filter((l) => l.is_active).map((listing) => (
                <Link key={listing.id} href={`/listings/${listing.id}`} className="group block">
                  <Card hover padding="none" className="overflow-hidden">
                    <div className="aspect-square bg-slate-800">
                      {listing.primary_image ? (
                        <img
                          src={listing.primary_image}
                          alt={listing.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-4xl opacity-20">🛍</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-slate-500 mb-1">{listing.category_name}</p>
                      <p className="text-sm font-semibold text-white line-clamp-1 group-hover:text-indigo-400 transition-colors">
                        {listing.title}
                      </p>
                      <p className="text-base font-bold text-white mt-1">
                        €{parseFloat(listing.price).toFixed(2)}
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}