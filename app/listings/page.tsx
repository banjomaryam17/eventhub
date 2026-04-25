export const dynamic = "force-dynamic";
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import PageLayout from "@/components/PageLayout";
import { LoadingSpinner, EmptyState, ConditionBadge, StarRating, Button } from "@/components/ui";

interface Listing {
  id: number;
  title: string;
  price: string;
  quantity: number;
  condition: string;
  category_name: string;
  category_slug: string;
  seller_username: string;
  average_rating: string;
  review_count: number;
  primary_image: string | null;
  created_at: string;
}

interface Pagination {
  page: number;
  totalPages: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const CATEGORIES = [
  { name: "All", slug: "" },
  { name: "Electronics", slug: "electronics" },
  { name: "Clothing", slug: "clothing" },
  { name: "Books", slug: "books" },
  { name: "Home & Garden", slug: "home-garden" },
  { name: "Sports", slug: "sports" },
  { name: "Toys & Games", slug: "toys-games" },
  { name: "Vehicles", slug: "vehicles" },
  { name: "Other", slug: "other" },
];

const SORT_OPTIONS = [
  { label: "Newest first",    value: "newest" },
  { label: "Oldest first",    value: "oldest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Top rated",       value: "top_rated" },
  { label: "Most reviewed",   value: "most_reviews" },
];

//  Listing Card 
function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link href={`/listings/${listing.id}`} className="group block">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-600 hover:shadow-xl hover:shadow-black/30 transition-all duration-200 h-full flex flex-col">
        {/* Image */}
        <div className="aspect-square bg-slate-800 relative overflow-hidden flex-shrink-0">
          {listing.primary_image ? (
            <img
              src={listing.primary_image}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-5xl opacity-20">🛍</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
          <div className="absolute top-3 left-3 flex flex-col gap-1">
  <ConditionBadge condition={listing.condition} />
  {listing.quantity === 0 && (
    <span className="text-xs font-semibold px-2 py-1 rounded-md bg-red-500/90 text-white backdrop-blur-sm">
      Out of Stock
    </span>
  )}
</div>
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col flex-1">
          <p className="text-xs text-slate-500 mb-1">{listing.category_name}</p>
          <h3 className="text-sm font-semibold text-white leading-snug mb-2 group-hover:text-indigo-400 transition-colors line-clamp-2 flex-1">
            {listing.title}
          </h3>
          <StarRating rating={parseFloat(listing.average_rating)} count={listing.review_count} />
          <div className="flex items-center justify-between mt-3">
            <span className="text-lg font-bold text-white">
              €{parseFloat(listing.price).toFixed(2)}
            </span>
            <span className="text-xs text-slate-500">@{listing.seller_username}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Main Page
export default function BrowseListingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read filters from URL so they persist on refresh
  const [search, setSearch]       = useState(searchParams.get("search") ?? "");
  const [category, setCategory]   = useState(searchParams.get("category") ?? "");
  const [condition, setCondition] = useState(searchParams.get("condition") ?? "");
  const [minPrice, setMinPrice]   = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice]   = useState(searchParams.get("maxPrice") ?? "");
  const [sortBy, setSortBy]       = useState(searchParams.get("sortBy") ?? "newest");
  const [page, setPage]           = useState(parseInt(searchParams.get("page") ?? "1"));

  const [listings, setListings]     = useState<Listing[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");

  // Build query string from current filters
  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (search)    params.set("search", search);
    if (category)  params.set("category", category);
    if (condition) params.set("condition", condition);
    if (minPrice)  params.set("minPrice", minPrice);
    if (maxPrice)  params.set("maxPrice", maxPrice);
    if (sortBy)    params.set("sortBy", sortBy);
    if (page > 1)  params.set("page", page.toString());
    return params.toString();
  }, [search, category, condition, minPrice, maxPrice, sortBy, page]);

  // Fetch listings whenever filters change
  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      setError("");
      try {
        const query = buildQuery();
        const res = await fetch(`/api/listings?${query}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setListings(data.listings);
        setPagination(data.pagination);
        // Update URL to reflect filters
        router.replace(`/listings?${query}`, { scroll: false });
      } catch (err: any) {
        setError(err.message ?? "Failed to load listings");
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, [buildQuery]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
  }

  function clearFilters() {
    setSearch("");
    setCategory("");
    setCondition("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
    setPage(1);
  }

  const hasActiveFilters = search || category || condition || minPrice || maxPrice || sortBy !== "newest";

  return (
    <PageLayout>
      <div className="flex flex-col lg:flex-row gap-8">

        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sticky top-24">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-white">Filters</h2>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="mb-5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search listings..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-3 pr-8 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </form>

            {/* Category */}
            <div className="mb-5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">
                Category
              </label>
              <div className="flex flex-col gap-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => { setCategory(cat.slug); setPage(1); }}
                    className={`text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                      category === cat.slug
                        ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Condition */}
            <div className="mb-5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">
                Condition
              </label>
              <div className="flex flex-col gap-1">
                {[
                  { label: "Any", value: "" },
                  { label: "New", value: "new" },
                  { label: "Used", value: "used" },
                  { label: "Refurbished", value: "refurbished" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setCondition(opt.value); setPage(1); }}
                    className={`text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                      condition === opt.value
                        ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="mb-5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">
                Price Range
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
                <span className="text-slate-600 text-sm">—</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>

            {/* Sort */}
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">
                Sort by
              </label>
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </aside>

        {/*  Listings Grid*/}
        <div className="flex-1 min-w-0">
          {/* Results header */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-slate-400 text-sm">
              {loading ? "Loading..." : `${pagination?.total ?? 0} listing${pagination?.total !== 1 ? "s" : ""} found`}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm mb-6">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && <LoadingSpinner message="Finding listings..." />}

          {/* Empty state */}
          {!loading && !error && listings.length === 0 && (
            <EmptyState
              icon="🔍"
              title="No listings found"
              description="Try adjusting your filters or search term"
              action={{ label: "Clear filters", href: "/listings" }}
            />
          )}

          {/* Grid */}
          {!loading && listings.length > 0 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-10">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={!pagination.hasPrev}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    ← Previous
                  </Button>
                  <span className="text-sm text-slate-400">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={!pagination.hasNext}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next →
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
