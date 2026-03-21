    "use client";

    import { useEffect, useState } from "react";
    import Link from "next/link";
    import { useRouter } from "next/navigation";

    interface SessionUser {
      userId: number;
      username: string;
      role: string;
    }

    // Placeholder listing card data (replace with real API data later)
    const PLACEHOLDER_LISTINGS = [
      { id: 1, title: "Sony WH-1000XM5 Headphones", price: 220, condition: "used", category: "Electronics", image: null, seller: "audiogeek", rating: 4.5 },
      { id: 2, title: "Nike Air Max 90 — Size 10", price: 85, condition: "used", category: "Clothing", image: null, seller: "sneakerhead", rating: 4.0 },
      { id: 3, title: "The Pragmatic Programmer", price: 18, condition: "new", category: "Books", image: null, seller: "devbooks", rating: 5.0 },
      { id: 4, title: "IKEA KALLAX Shelf Unit", price: 45, condition: "used", category: "Home & Garden", image: null, seller: "homestuff", rating: 3.5 },
      { id: 5, title: "iPad Pro 11\" 2022 256GB", price: 650, condition: "refurbished", category: "Electronics", image: null, seller: "techresell", rating: 4.5 },
      { id: 6, title: "Levi's 501 Jeans W32 L30", price: 35, condition: "used", category: "Clothing", image: null, seller: "vintagewear", rating: 4.0 },
    ];

    const CATEGORIES = [
      { name: "Electronics", icon: "💻", slug: "electronics" },
      { name: "Clothing", icon: "👕", slug: "clothing" },
      { name: "Books", icon: "📚", slug: "books" },
      { name: "Home & Garden", icon: "🏡", slug: "home-garden" },
      { name: "Sports", icon: "⚽", slug: "sports" },
      { name: "Toys & Games", icon: "🎮", slug: "toys-games" },
      { name: "Vehicles", icon: "🚗", slug: "vehicles" },
      { name: "Other", icon: "📦", slug: "other" },
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

    function ListingCard({ listing }: { listing: typeof PLACEHOLDER_LISTINGS[0] }) {
      const conditionColor = {
        new: "text-emerald-400 bg-emerald-400/10",
        used: "text-amber-400 bg-amber-400/10",
        refurbished: "text-blue-400 bg-blue-400/10",
      }[listing.condition] ?? "text-slate-400 bg-slate-400/10";

      return (
        <Link href={`/listings/${listing.id}`} className="group block">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-600 hover:shadow-xl hover:shadow-black/30 transition-all duration-200">
            {/* Image placeholder */}
            <div className="aspect-square bg-slate-800 flex items-center justify-center relative overflow-hidden">
              <div className="text-5xl opacity-20">🛍</div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
              <span className={`absolute top-3 left-3 text-xs font-semibold px-2 py-0.5 rounded-full ${conditionColor}`}>
                {listing.condition}
              </span>
            </div>
            {/* Info */}
            <div className="p-4">
              <p className="text-xs text-slate-500 mb-1">{listing.category}</p>
              <h3 className="text-sm font-semibold text-white leading-snug mb-2 group-hover:text-indigo-400 transition-colors line-clamp-2">
                {listing.title}
              </h3>
              <StarRating rating={listing.rating} />
              <div className="flex items-center justify-between mt-3">
                <span className="text-lg font-bold text-white">€{listing.price}</span>
                <span className="text-xs text-slate-500">@{listing.seller}</span>
              </div>
            </div>
          </div>
        </Link>
      );
    }
    export default function HomePage() {
      const router = useRouter();
      const [user, setUser] = useState<SessionUser | null>(null);
      const [loading, setLoading] = useState(true);
      const [search, setSearch] = useState("");

      useEffect(() => {
        fetch("/api/auth/session")
          .then((res) => res.ok ? res.json() : null)
          .then((data) => {
            if (data?.user) setUser(data.user);
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      }, []);

      async function handleLogout() {
        await fetch("/api/auth/logout", { method: "POST" });
        setUser(null);
        router.push("/auth/login");
      }

      function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        if (search.trim()) router.push(`/listings?search=${encodeURIComponent(search.trim())}`);
      }

      return (
        <div className="min-h-screen bg-slate-950 text-white">

          {/*NAVBAR*/}
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
                  {!loading && (
                    <>
                      {user ? (
                        <>
                          <Link href="/sell/new" className="hidden sm:flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Sell
                          </Link>
                          <Link href="/orders" className="text-slate-400 hover:text-white text-sm px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors hidden sm:block">
                            Orders
                          </Link>
                          <Link href="/cart" className="relative text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
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

          {/*ADMIN BANNER only visible to admins */}
          {user?.role === "admin" && (
            <div className="bg-amber-500/10 border-b border-amber-500/20">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-amber-400 text-sm font-medium">Admin mode — you have elevated privileges</span>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/admin" className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-3 py-1.5 rounded-lg transition-colors font-medium">
                    Admin Dashboard
                  </Link>
                  <Link href="/admin/listings" className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-3 py-1.5 rounded-lg transition-colors font-medium">
                    Manage Listings
                  </Link>
                  <Link href="/admin/users" className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-3 py-1.5 rounded-lg transition-colors font-medium">
                    Manage Users
                  </Link>
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
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-teal-400">
                    reimagined
                  </span>
                </h1>
                <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10">
                  Discover unique items from sellers in your area. Buy with confidence, sell with ease.
                </p>
                {/* Mobile search */}
                <form onSubmit={handleSearch} className="flex gap-2 max-w-lg mx-auto sm:hidden mb-6">
                  <input
                    type="text"
                    placeholder="Search listings..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-xl text-sm font-medium transition-colors">
                    Search
                  </button>
                </form>
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <Link href="/listings" className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-3 rounded-xl transition-colors">
                    Browse listings
                  </Link>
                  {user ? (
                    <Link href="/sell/new" className="border border-slate-700 hover:border-slate-500 text-white font-medium px-6 py-3 rounded-xl transition-colors hover:bg-slate-800">
                      + Create listing
                    </Link>
                  ) : (
                    <Link href="/auth/register" className="border border-slate-700 hover:border-slate-500 text-white font-medium px-6 py-3 rounded-xl transition-colors hover:bg-slate-800">
                      Start selling
                    </Link>
                  )}
                </div>
              </div>
            </section>

            {/* CATEGORIES*/}
            <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
              <h2 className="text-lg font-bold text-white mb-6">Browse by category</h2>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/listings?category=${cat.slug}`}
                    className="flex flex-col items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 rounded-xl p-3 transition-all group"
                  >
                    <span className="text-2xl">{cat.icon}</span>
                    <span className="text-xs text-slate-400 group-hover:text-white transition-colors text-center leading-tight">{cat.name}</span>
                  </Link>
                ))}
              </div>
            </section>

            {/* ── FEATURED LISTINGS*/}
            <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">Recent listings</h2>
                <Link href="/listings" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {PLACEHOLDER_LISTINGS.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </section>

            {/* ONLY FOR LOGGED IN NON ADMINS*/}
            {user && user.role !== "admin" && (
              <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
                <div className="bg-gradient-to-r from-indigo-600/20 to-teal-600/20 border border-indigo-500/20 rounded-2xl p-8 flex items-center justify-between flex-wrap gap-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Got something to sell?</h3>
                    <p className="text-slate-400 text-sm">Create a listing in under 2 minutes and reach buyers today.</p>
                  </div>
                  <Link href="/sell/new" className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-3 rounded-xl transition-colors flex-shrink-0">
                    + Create listing
                  </Link>
                </div>
              </section>
            )}

            {/* NOT LOGGED IN */}
            {!user && !loading && (
              <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
                <div className="bg-gradient-to-r from-indigo-600/20 to-teal-600/20 border border-indigo-500/20 rounded-2xl p-8 text-center">
                  <h3 className="text-xl font-bold text-white mb-2">Join the marketplace</h3>
                  <p className="text-slate-400 text-sm mb-6">Create a free account to start buying and selling.</p>
                  <div className="flex items-center justify-center gap-3">
                    <Link href="/auth/register" className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-3 rounded-xl transition-colors">
                      Create account
                    </Link>
                    <Link href="/auth/login" className="border border-slate-700 hover:border-slate-500 text-white font-medium px-6 py-3 rounded-xl transition-colors hover:bg-slate-800">
                      Sign in
                    </Link>
                  </div>
                </div>
              </section>
            )}
          </main>

          {/* FOOTER*/}
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


