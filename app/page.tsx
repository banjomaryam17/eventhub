"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

interface SessionUser {
  userId: number;
  username: string;
  role: string;
}

//CATEGORIES
const CATEGORIES = [
  {
    name: "Electronics", slug: "electronics",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    name: "Clothing", slug: "clothing",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
      </svg>
    )
  },
  {
    name: "Books", slug: "books",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )
  },
  {
    name: "Home & Garden", slug: "home-garden",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  },
  {
    name: "Sports", slug: "sports",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12a9 9 0 1118 0 9 9 0 01-18 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.5 21C11.5 21 6 16.5 6 12s5.5-9 5.5-9M12.5 21C12.5 21 18 16.5 18 12S12.5 3 12.5 3M3 12h18" />
      </svg>
    )
  },
  {
    name: "Toys & Games", slug: "toys-games",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
      </svg>
    )
  },
  {
    name: "Vehicles", slug: "vehicles",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l1 1h10l1-1zm0 0V8h4l2 5v3h-6z" />
      </svg>
    )
  },
  {
    name: "Other", slug: "other",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
      </svg>
    )
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className="w-3 h-3" fill={i <= Math.round(rating) ? "#f59e0b" : "#334155"} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs text-slate-400 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

function ListingCard({ listing }: { listing: any }) {
  const conditionColor = {
    new: "text-emerald-400 bg-emerald-400/10",
    used: "text-amber-400 bg-amber-400/10",
    refurbished: "text-blue-400 bg-blue-400/10",
  }[listing.condition as string] ?? "text-slate-400 bg-slate-400/10";

  return (
    <Link href={`/listings/${listing.id}`} className="group block">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-600 hover:shadow-xl hover:shadow-black/30 transition-all duration-200">
        <div className="aspect-square bg-slate-800 flex items-center justify-center relative overflow-hidden">
          {listing.primary_image ? (
            <img src={listing.primary_image} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <svg className="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
          <span className={`absolute top-3 left-3 text-xs font-semibold px-2 py-0.5 rounded-full ${conditionColor}`}>
            {listing.condition}
          </span>
        </div>
        <div className="p-4">
          <p className="text-xs text-slate-500 mb-1">{listing.category_name}</p>
          <h3 className="text-sm font-semibold text-white leading-snug mb-2 group-hover:text-indigo-400 transition-colors line-clamp-2">
            {listing.title}
          </h3>
          <StarRating rating={parseFloat(listing.average_rating ?? "0")} />
          <div className="flex items-center justify-between mt-3">
            <span className="text-lg font-bold text-white">€{parseFloat(listing.price).toFixed(2)}</span>
            <span className="text-xs text-slate-500">@{listing.seller_username}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [user, setUser]           = useState<SessionUser | null>(null);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [listings, setListings]   = useState<any[]>([]);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          // Fetch cart count
          fetch("/api/cart")
            .then((res) => res.ok ? res.json() : null)
            .then((cartData) => {
              if (cartData?.summary?.item_count) setCartCount(cartData.summary.item_count);
            })
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch("/api/listings?limit=6&sortBy=newest")
      .then((res) => res.json())
      .then((data) => { if (data.listings) setListings(data.listings); })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setCartCount(0);
    router.push("/auth/login");
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) router.push(`/listings?search=${encodeURIComponent(search.trim())}`);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
                </svg>
              </div>
              <span className="font-bold text-white text-xl tracking-tight">
                Haul<span className="text-indigo-400">.co</span>
              </span>
            </Link>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden sm:block">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search listings..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                />
              </div>
            </form>

            {/* Nav links */}
            <div className="flex items-center gap-2">
               <ThemeToggle />
              {!loading && (
                <>
                  {user ? (
                    <>
                                       {/* Wishlist */}
<Link href="/wishlist" className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors">
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
</Link>
                      <Link href="/sell/new" className="hidden sm:flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Sell
                      </Link>
                      <Link href="/orders" className="text-slate-400 hover:text-white text-sm px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors hidden sm:block">
                        Orders
                      </Link>
                      {/* Cart with badge */}
                      <Link href="/cart" className="relative text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {cartCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center leading-none">
                            {cartCount > 9 ? "9+" : cartCount}
                          </span>
                        )}
                      </Link>
                      <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
                        <Link href="/profile" className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center hover:border-indigo-400 transition-colors">
                          <span className="text-xs font-bold text-indigo-400">{user.username[0].toUpperCase()}</span>
                        </Link>
                        <button onClick={handleLogout} className="text-xs text-slate-500 hover:text-white transition-colors">
                          Logout
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Link href="/auth/login" className="text-slate-400 hover:text-white text-sm px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors">
                        Sign in
                      </Link>
                      <Link href="/auth/register" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
                        Register
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ADMIN BANNER */}
      {user?.role.toLowerCase() === "admin" && (
        <div className="bg-amber-500/10 border-b border-amber-500/20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-amber-400 text-sm font-medium">Admin mode — you have elevated privileges</span>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/admin" className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-3 py-1.5 rounded-lg transition-colors font-medium">Admin Dashboard</Link>
              <Link href="/admin/listings" className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-3 py-1.5 rounded-lg transition-colors font-medium">Manage Listings</Link>
              <Link href="/admin/users" className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-3 py-1.5 rounded-lg transition-colors font-medium">Manage Users</Link>
            </div>
          </div>
        </div>
      )}

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-slate-800/60">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.15),_transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(20,184,166,0.08),_transparent_60%)]" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 text-center">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-xs text-indigo-300 font-medium">Buy and sell in your community</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6 leading-tight">
              Your local marketplace,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-teal-400">reimagined</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10">
              Discover unique items from sellers in your area. Buy with confidence, sell with ease.
            </p>
            <form onSubmit={handleSearch} className="flex gap-2 max-w-lg mx-auto sm:hidden mb-6">
              <input type="text" placeholder="Search listings..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-xl text-sm font-medium transition-colors">Search</button>
            </form>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/listings" className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-3 rounded-xl transition-colors">Browse listings</Link>
              {user ? (
                <Link href="/sell/new" className="border border-slate-700 hover:border-slate-500 text-white font-medium px-6 py-3 rounded-xl transition-colors hover:bg-slate-800">+ Create listing</Link>
              ) : (
                <Link href="/auth/register" className="border border-slate-700 hover:border-slate-500 text-white font-medium px-6 py-3 rounded-xl transition-colors hover:bg-slate-800">Start selling</Link>
              )}
            </div>
          </div>
        </section>

        {/* CATEGORIES — SVG icons */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-lg font-bold text-white mb-6">Browse by category</h2>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/listings?category=${cat.slug}`}
                className="flex flex-col items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 rounded-xl p-3 transition-all group"
              >
                <span className="text-slate-400 group-hover:text-indigo-400 transition-colors">
                  {cat.icon}
                </span>
                <span className="text-xs text-slate-400 group-hover:text-white transition-colors text-center leading-tight">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* RECENT LISTINGS */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">Recent listings</h2>
            <Link href="/listings" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">View all →</Link>
          </div>
          {listings.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-12">No listings yet — be the first to sell something!</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </section>

        {user && user.role.toLowerCase() !== "admin" && (
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
            <div className="bg-gradient-to-r from-indigo-600/20 to-teal-600/20 border border-indigo-500/20 rounded-2xl p-8 flex items-center justify-between flex-wrap gap-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Got something to sell?</h3>
                <p className="text-slate-400 text-sm">Create a listing in under 2 minutes and reach buyers today.</p>
              </div>
              <Link href="/sell/new" className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-3 rounded-xl transition-colors flex-shrink-0">+ Create listing</Link>
            </div>
          </section>
        )}

        {!user && !loading && (
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
            <div className="bg-gradient-to-r from-indigo-600/20 to-teal-600/20 border border-indigo-500/20 rounded-2xl p-8 text-center">
              <h3 className="text-xl font-bold text-white mb-2">Join the marketplace</h3>
              <p className="text-slate-400 text-sm mb-6">Create a free account to start buying and selling.</p>
              <div className="flex items-center justify-center gap-3">
                <Link href="/auth/register" className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-3 rounded-xl transition-colors">Create account</Link>
                <Link href="/auth/login" className="border border-slate-700 hover:border-slate-500 text-white font-medium px-6 py-3 rounded-xl transition-colors hover:bg-slate-800">Sign in</Link>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-slate-800/60 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between flex-wrap gap-4">
          <p className="text-xs text-slate-600">© 2026 Haul.co. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="/terms" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Terms</a>
            <a href="/privacy" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
