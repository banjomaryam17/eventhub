export const dynamic = "force-dynamic";
"use client";

import { useEffect, useState } from "react";
import { LoadingSpinner, EmptyState } from "@/components/ui";
import ConfirmModal from "@/components/ConfirmModal";

interface Listing {
  id: number;
  title: string;
  price: string;
  condition: string;
  quantity: number;
  is_active: boolean;
  category_name: string;
  seller_username: string;
  seller_email: string;
  created_at: string;
}

export default function AdminListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [removing, setRemoving] = useState<number | null>(null);
  const [modal, setModal] = useState<any>(null);

  async function fetchListings() {
    try {
      const res = await fetch("/api/admin/listings");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setListings(data.listings);
    } catch (err: any) {
      setError(err.message ?? "Failed to fetch listings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchListings(); }, []);

  function handleRemove(listingId: number,title: string) {
  setModal({
    title: "Remove listing",
    message: "Are you sure you want to remove this listing? This cannot be undone.",
    confirmLabel: "Remove",
    variant: "danger",
    onConfirm: () => actuallyDelete(listingId),
  });
}

async function actuallyDelete(listingId: number) {
  setRemoving(listingId);
  const res = await fetch(`/api/listings/${listingId}`, { method: "DELETE" });
  if (res.ok) setListings((prev) => prev.filter((l) => l.id !== listingId));
  setRemoving(null);
}

  if (loading) return <LoadingSpinner message="Loading listings..." />;

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-6">
        Manage Listings
        <span className="text-slate-500 font-normal text-base ml-2">({listings.length})</span>
      </h2>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm mb-6">
          {error}
        </div>
      )}

      {listings.length === 0 ? (
        <EmptyState icon="🛍" title="No listings found" />
      ) : (
        <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-800 text-slate-400">
              <tr>
                <th className="text-left p-3">Title</th>
                <th className="text-left p-3">Price</th>
                <th className="text-left p-3">Seller</th>
                <th className="text-left p-3">Category</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <tr key={listing.id} className="border-t border-slate-800 hover:bg-slate-800/40">
                  <td className="p-3 font-medium text-white max-w-xs">
                    <p className="line-clamp-1">{listing.title}</p>
                  </td>
                  <td className="p-3 text-slate-300">€{parseFloat(listing.price).toFixed(2)}</td>
                  <td className="p-3 text-slate-400">@{listing.seller_username}</td>
                  <td className="p-3 text-slate-400">{listing.category_name}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      listing.is_active
                        ? "bg-emerald-400/10 text-emerald-400"
                        : "bg-red-400/10 text-red-400"
                    }`}>
                      {listing.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => handleRemove(listing.id, listing.title)}
                      disabled={removing === listing.id || !listing.is_active}
                      className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 px-3 py-1 rounded-lg text-xs transition-colors disabled:opacity-30"
                    >
                      {removing === listing.id ? "Removing..." : "Remove"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmModal config={modal} onClose={() => setModal(null)} />
    </div>
  );
}
