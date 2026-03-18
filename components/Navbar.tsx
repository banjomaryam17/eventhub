"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface SessionUser {
  userId: number;
  username: string;
  role: string;
}

const Navbar = () => {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => (res.ok ? res.json() : null))
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

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="font-bold text-white text-xl tracking-tight">
              Haul<span className="text-indigo-400">.co</span>
            </span>
          </Link>

          {/* Nav links */}
          <div className="hidden sm:flex items-center gap-1">
            <Link href="/listings" className="text-slate-400 hover:text-white text-sm px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors">
              Browse
            </Link>
            {user && (
              <>
                <Link href="/orders" className="text-slate-400 hover:text-white text-sm px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors">
                  Orders
                </Link>
                <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors">
                  Dashboard
                </Link>
                {user.role === "admin" && (
                  <Link href="/admin" className="text-amber-400 hover:text-amber-300 text-sm px-3 py-2 rounded-xl hover:bg-amber-400/10 transition-colors">
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {!loading && (
              <>
                {user ? (
                  <>
                    {/* Cart */}
                    <Link href="/cart" className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </Link>

                    {/* Sell button */}
                    <Link href="/sell/new" className="hidden sm:flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
                      + Sell
                    </Link>

                    {/* User avatar + logout */}
                    <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
                      <Link href="/profile" className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center hover:border-indigo-400 transition-colors">
                        <span className="text-xs font-bold text-indigo-400">
                          {user.username[0].toUpperCase()}
                        </span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="text-xs text-slate-500 hover:text-white transition-colors"
                      >
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
  );
};

export default Navbar;
