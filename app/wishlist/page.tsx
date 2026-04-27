"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageLayout from "@/components/PageLayout";
import { Card, EmptyState, LoadingSpinner, Button, ConditionBadge, StarRating } from "@/components/ui";

interface WishlistItem {
  listing_id: number;
  title: string;
  price: string;
  condition: string;
  is_active: boolean;
  average_rating: string;
  review_count: number;
  category_name: string;
  primary_image: string | null;
}

export default function WishlistPage() {
  const router = useRouter();

  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function fetchWishlist() {
    try {
      const res = await fetch("/api/wishlist");

      if (res.status === 401) {
        router.push("/auth/login");
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to load wishlist");
        return;
      }

      setItems(data.wishlist ?? []);
    } catch {
      setError("Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  }

  async function removeFromWishlist(listingId: number) {
    setRemoving(listingId);

    try {
      const res = await fetch(`/api/wishlist/${listingId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.listing_id !== listingId));
      }
    } finally {
      setRemoving(null);
    }
  }

  useEffect(() => {
    fetchWishlist();
  }, []);

  if (loading) {
    return (
      <PageLayout title="Wishlist">
        <LoadingSpinner message="Loading wishlist..." />
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Wishlist" subtitle={`${items.length} saved item${items.length !== 1 ? "s" : ""}`}>
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm mb-6">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon="♡"
          title="Your wishlist is empty"
          description="Save listings you like and come back to them later"
          action={{ label: "Browse listings", href: "/listings" }}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <Card key={item.listing_id} hover padding="none" className="overflow-hidden">
              <Link href={`/listings/${item.listing_id}`} className="block">
                <div className="aspect-square bg-slate-800">
                  {item.primary_image ? (
                    <img
                      src={item.primary_image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl opacity-20">🛍</span>
                    </div>
                  )}
                </div>
              </Link>

              <div className="p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-xs text-slate-500">{item.category_name}</p>
                  <ConditionBadge condition={item.condition} />
                </div>

                <Link href={`/listings/${item.listing_id}`}>
                  <p className="text-sm font-semibold text-white line-clamp-2 hover:text-indigo-400 transition-colors">
                    {item.title}
                  </p>
                </Link>

                <div className="mt-2">
                  <StarRating
                    rating={parseFloat(item.average_rating)}
                    count={item.review_count}
                  />
                </div>

                <p className="text-base font-bold text-white mt-2">
                  €{parseFloat(item.price).toFixed(2)}
                </p>

                {!item.is_active && (
                  <p className="text-xs text-red-400 mt-1">
                    No longer available
                  </p>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  fullWidth
                  className="mt-3"
                  disabled={removing === item.listing_id}
                  onClick={() => removeFromWishlist(item.listing_id)}
                >
                  {removing === item.listing_id ? "Removing..." : "Remove"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageLayout>
  );
}