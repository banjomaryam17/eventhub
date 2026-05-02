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

interface Review {
  rating: number;
  content: string;
  created_at: string;
  reviewer_username: string;
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

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-amber-400">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s}>{rating >= s ? "★" : rating >= s - 0.5 ? "½" : "☆"}</span>
      ))}
    </span>
  );
}

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser]                       = useState<UserProfile | null>(null);
  const [listings, setListings]               = useState<Listing[]>([]);
  const [sellerReputation, setSellerReputation] = useState<SellerReputation | null>(null);
  const [buyerReputation, setBuyerReputation]   = useState<BuyerReputation | null>(null);
  const [reviews, setReviews]                 = useState<Review[]>([]);
  const [avgRating, setAvgRating]             = useState<string | null>(null);
  const [memberSince, setMemberSince]         = useState<string>("");
  const [location, setLocation]               = useState<string>("");
  const [bio, setBio]                         = useState<string>("");
  const [name, setName]                       = useState<string>("");
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState("");

  // Edit modal state
  const [editOpen, setEditOpen]       = useState(false);
  const [editName, setEditName]       = useState("");
  const [editBio, setEditBio]         = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [saving, setSaving]           = useState(false);
  const [saveError, setSaveError]     = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const sessionRes = await fetch("/api/auth/session");
        if (!sessionRes.ok) { router.push("/auth/login"); return; }
        const sessionData = await sessionRes.json();
        setUser(sessionData.user);

        const userRes = await fetch(`/api/users/${sessionData.user.userId}`);
        if (!userRes.ok) throw new Error("Failed to load user profile");
        const userData = await userRes.json();

        setSellerReputation(userData.user.seller_reputation);
        setBuyerReputation(userData.user.buyer_reputation);
        setReviews(userData.user.reviews ?? []);
        setAvgRating(userData.user.avg_rating);
        setMemberSince(userData.user.created_at);
        setLocation(userData.user.location ?? "");
        setBio(userData.user.bio ?? "");
        setName(userData.user.name ?? "");

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

  function openEdit() {
    setEditName(name);
    setEditBio(bio);
    setEditLocation(location);
    setSaveError("");
    setEditOpen(true);
  }

  async function saveProfile() {
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch(`/api/users/${user?.userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, bio: editBio, location: editLocation }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setName(editName);
      setBio(editBio);
      setLocation(editLocation);
      setEditOpen(false);
    } catch {
      setSaveError("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <PageLayout title="Profile"><LoadingSpinner message="Loading profile..." /></PageLayout>;
  }

  return (
    <PageLayout title="My Profile">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm mb-6">
          {error}
        </div>
      )}

      <div className="max-w-4xl flex flex-col gap-6">

        {/* Profile header */}
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-indigo-400">
                {user?.username[0].toUpperCase()}
              </span>
            </div>

            <div className="flex-1 min-w-0">
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

              {/* Bio */}
              {bio && <p className="text-slate-300 text-sm mt-1">{bio}</p>}
              {!bio && (
                <p className="text-slate-500 text-sm mt-1 italic">No bio yet — add one!</p>
              )}

              {/* Location + Member since + Rating */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                {location && (
                  <span className="text-xs text-slate-400">📍 {location}</span>
                )}
                {memberSince && (
                  <span className="text-xs text-slate-400">
                    🗓 Member since{" "}
                    {new Date(memberSince).toLocaleDateString("en-IE", {
                      month: "long", year: "numeric",
                    })}
                  </span>
                )}
                {avgRating && (
                  <span className="text-xs text-slate-400">
                    ⭐ {avgRating} ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
                  </span>
                )}
              </div>

              <p className="text-slate-400 text-sm mt-2">
                {listings.length} listing{listings.length !== 1 ? "s" : ""} ·{" "}
                {sellerReputation?.total_sales ?? 0} sales ·{" "}
                {buyerReputation?.total_purchases ?? 0} purchases
              </p>
            </div>

            {/* Action buttons — stack on mobile */}
            <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
              <Button onClick={openEdit} variant="secondary" size="sm">Edit profile</Button>
              <Button href="/wishlist" variant="secondary" size="sm">♡ Wishlist</Button>
              <Button href="/dashboard" variant="secondary" size="sm">Dashboard</Button>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold text-white">{listings.length}</p>
            <p className="text-xs text-slate-500 mt-1">Listings</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold text-indigo-400">{sellerReputation?.total_sales ?? 0}</p>
            <p className="text-xs text-slate-500 mt-1">Sales</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold text-amber-400">{sellerReputation?.score ?? 100}</p>
            <p className="text-xs text-slate-500 mt-1">Seller Score · {sellerReputation?.tier ?? "Trusted"}</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold text-emerald-400">{buyerReputation?.score ?? 100}</p>
            <p className="text-xs text-slate-500 mt-1">Buyer Score · {buyerReputation?.tier ?? "Trusted"}</p>
          </Card>
        </div>

        {/* Trust status */}
        <Card>
          <h3 className="text-lg font-bold text-white mb-4">Trust status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl border border-slate-800 p-4">
              <p className="text-slate-400 mb-1">Seller</p>
              <p className="text-white font-semibold">
                {sellerReputation?.score ?? 100}/100 · {sellerReputation?.tier ?? "Trusted"}
              </p>
              <p className="text-slate-500 mt-2">Based on verified buyer reviews and successful delivered sales.</p>
            </div>
            <div className="rounded-xl border border-slate-800 p-4">
              <p className="text-slate-400 mb-1">Buyer</p>
              <p className="text-white font-semibold">
                {buyerReputation?.score ?? 100}/100 · {buyerReputation?.tier ?? "Trusted"}
              </p>
              <p className="text-slate-500 mt-2">Based on completed order history and buyer reliability.</p>
            </div>
          </div>
        </Card>

        {/* Reviews */}
        {reviews.length > 0 && (
          <Card>
            <h3 className="text-lg font-bold text-white mb-4">
              Reviews ⭐ {avgRating} ({reviews.length})
            </h3>
            <div className="flex flex-col gap-3">
              {reviews.map((review, i) => (
                <div key={i} className="border-b border-slate-800 last:border-0 pb-3 last:pb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StarRating rating={review.rating} />
                    <span className="text-xs text-slate-500">@{review.reviewer_username}</span>
                    <span className="text-xs text-slate-600 ml-auto">
                      {new Date(review.created_at).toLocaleDateString("en-IE", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </span>
                  </div>
                  {review.content && (
                    <p className="text-sm text-slate-300">"{review.content}"</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* My listings */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4">My listings</h3>
          {listings.filter((l) => l.is_active).length === 0 ? (
            <EmptyState
              icon=""
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

      {/* Edit Profile Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-white mb-4">Edit Profile</h2>

            {saveError && (
              <p className="text-red-400 text-sm mb-4">{saveError}</p>
            )}

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Name</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Bio</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell buyers a little about yourself..."
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Location (optional)</label>
                <input
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="e.g. Dublin, Ireland"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-sm hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveProfile}
                disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}