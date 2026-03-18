"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageLayout from "@/components/PageLayout";
import {
  Button,
  Card,
  ConditionBadge,
  StatusBadge,
  StarRating,
  LoadingSpinner,
  EmptyState,
} from "@/components/ui";

interface Listing {
  id: number;
  title: string;
  description: string;
  price: string;
  quantity: number;
  condition: string;
  is_anonymous: boolean;
  is_active: boolean;
  average_rating: string;
  review_count: number;
  created_at: string;
  category_name: string;
  category_slug: string;
  seller_id: number | null;
  seller_username: string;
  seller_is_verified: boolean | null;
  seller_reputation: number | null;
  seller_total_sales: number | null;
  images: { id: number; image_url: string; is_primary: boolean }[];
  reviews: {
    id: number;
    rating: number;
    content: string;
    created_at: string;
    reviewer_username: string;
  }[];
}

interface SessionUser {
  userId: number;
  username: string;
  role: string;
}

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id;

  const [listing, setListing]         = useState<Listing | null>(null);
  const [user, setUser]               = useState<SessionUser | null>(null);
  const [loading, setLoading]         = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState("");
  const [cartError, setCartError]     = useState("");
  const [quantity, setQuantity]       = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  // Fetch session and listing in parallel
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [listingRes, sessionRes] = await Promise.all([
          fetch(`/api/listings/${listingId}`),
          fetch("/api/auth/session"),
        ]);

        if (!listingRes.ok) {
          setLoading(false);
          return;
        }

        const listingData = await listingRes.json();
        setListing(listingData.listing);

        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          if (sessionData?.user) setUser(sessionData.user);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [listingId]);

  async function handleAddToCart() {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    setAddingToCart(true);
    setCartMessage("");
    setCartError("");

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: listingId, quantity }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCartError(data.error);
      } else {
        setCartMessage(data.message);
      }
    } catch {
      setCartError("Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  }

  const isOwnListing = user && listing && user.userId === listing.seller_id;
  const isAdmin = user?.role === "admin";

  if (loading) return (
    <PageLayout>
      <LoadingSpinner message="Loading listing..." />
    </PageLayout>
  );

  if (!listing) return (
    <PageLayout>
      <EmptyState
        icon="🔍"
        title="Listing not found"
        description="This listing may have been removed or doesn't exist"
        action={{ label: "Browse listings", href: "/listings" }}
      />
    </PageLayout>
  );

  const primaryImage = listing.images?.find((img) => img.is_primary) ?? listing.images?.[0];
  const allImages = listing.images ?? [];

  return (
    <PageLayout showBack backHref="/listings">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* ── Images*/}
        <div className="flex flex-col gap-3">
          {/* Main image */}
          <div className="aspect-square bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            {allImages.length > 0 ? (
              <img
                src={allImages[activeImage]?.image_url}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-8xl opacity-20">🛍</span>
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {allImages.length > 1 && (
            <div className="flex gap-2">
              {allImages.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${
                    activeImage === i ? "border-indigo-500" : "border-slate-700 hover:border-slate-500"
                  }`}
                >
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Details ──────────────────────────────────────── */}
        <div className="flex flex-col gap-5">
          {/* Category + condition */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500">{listing.category_name}</span>
            <span className="text-slate-700">·</span>
            <ConditionBadge condition={listing.condition} />
            {!listing.is_active && (
              <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">
                Sold / Unavailable
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
            {listing.title}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <StarRating
              rating={parseFloat(listing.average_rating)}
              count={listing.review_count}
            />
            {listing.review_count === 0 && (
              <span className="text-xs text-slate-500">No reviews yet</span>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              €{parseFloat(listing.price).toFixed(2)}
            </span>
            <span className="text-slate-500 text-sm">
              {listing.quantity} available
            </span>
          </div>

          {/* Description */}
          {listing.description && (
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-1">Description</h3>
              <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">
                {listing.description}
              </p>
            </div>
          )}

          {/* Seller info */}
          <Card padding="sm" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-indigo-400">
                {listing.seller_username[0].toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {listing.seller_username}
                {listing.seller_is_verified && (
                  <span className="ml-1.5 text-xs text-emerald-400">✓ Verified</span>
                )}
              </p>
              {listing.seller_total_sales !== null && (
                <p className="text-xs text-slate-500">
                  {listing.seller_total_sales} sales
                  {listing.seller_reputation !== null && ` · ${listing.seller_reputation}% reputation`}
                </p>
              )}
            </div>
          </Card>

          {/* Add to cart — only if active and not your own listing */}
          {listing.is_active && !isOwnListing && !isAdmin && (
            <div className="flex flex-col gap-3">
              {/* Quantity selector */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-400">Quantity:</span>
                <div className="flex items-center border border-slate-700 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    −
                  </button>
                  <span className="px-4 py-2 text-white text-sm font-medium border-x border-slate-700">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(listing.quantity, q + 1))}
                    className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <Button
                onClick={handleAddToCart}
                disabled={addingToCart}
                size="lg"
                fullWidth
              >
                {addingToCart ? "Adding..." : "Add to cart"}
              </Button>

              {cartMessage && (
                <p className="text-emerald-400 text-sm text-center">{cartMessage}</p>
              )}
              {cartError && (
                <p className="text-red-400 text-sm text-center">{cartError}</p>
              )}
            </div>
          )}

          {/* Own listing actions */}
          {isOwnListing && (
            <div className="flex gap-2">
              <Button href={`/sell/edit/${listing.id}`} variant="secondary" fullWidth>
                Edit listing
              </Button>
            </div>
          )}

          {/* Admin actions */}
          {isAdmin && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <p className="text-amber-400 text-xs font-semibold mb-2">Admin actions</p>
              <Button variant="danger" size="sm">
                Remove listing
              </Button>
            </div>
          )}

          {/* Not logged in */}
          {!user && listing.is_active && (
            <Button href="/auth/login" size="lg" fullWidth>
              Sign in to purchase
            </Button>
          )}
        </div>
      </div>

      {/* ── Reviews */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-white mb-6">
          Reviews
          {listing.review_count > 0 && (
            <span className="text-slate-500 font-normal text-base ml-2">
              ({listing.review_count})
            </span>
          )}
        </h2>

        {listing.reviews.length === 0 ? (
          <Card>
            <p className="text-slate-500 text-sm text-center py-6">
              No reviews yet — be the first to review this listing
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {listing.reviews.map((review) => (
              <Card key={review.id} padding="sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-slate-400">
                        {review.reviewer_username[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{review.reviewer_username}</p>
                      <StarRating rating={review.rating} />
                    </div>
                  </div>
                  <span className="text-xs text-slate-600">
                    {new Date(review.created_at).toLocaleDateString("en-IE")}
                  </span>
                </div>
                {review.content && (
                  <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                    {review.content}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
