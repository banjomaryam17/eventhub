"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ConfirmModal from "./ConfirmModal";
import ThemeToggle from "@/components/ThemeToggle";

interface SessionUser {
  userId: number;
  username: string;
  role: string;
}

const Navbar = () => {
  const router = useRouter();
  const [user, setUser]         = useState<SessionUser | null>(null);
  const [loading, setLoading]   = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [modal, setModal]         = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          // Fetch cart count after session is confirmed
          fetch("/api/cart")
            .then((res) => res.ok ? res.json() : null)
            .then((cartData) => {
              if (cartData?.summary?.item_count) {
                setCartCount(cartData.summary.item_count);
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

function handleLogout() {
  setMenuOpen(false);
  setModal({
    title: "Log out",
    message: "Are you sure you want to log out?",
    confirmLabel: "Log out",
    variant: "warning",
    onConfirm: actuallyLogout,
  });
}

async function actuallyLogout() {
  await fetch("/api/auth/logout", { method: "POST" });
  setUser(null);
  setCartCount(0);
  router.push("/auth/login");
}

 return (
    <>
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

            {/* Desktop nav links */}
            <div className="hidden sm:flex items-center gap-1">
              <Link href="/listings" className="text-slate-400 hover:text-white text-sm px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors">
                Browse
              </Link>
              {user && (
                <>
                  <Link href="/orders" className="text-slate-400 hover:text-white text-sm px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors">
                    My Orders
                  </Link>
                  <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors">
                    Dashboard
                  </Link>
                  {user.role.toLowerCase() === "admin" && (
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

                      {/* Sell button — desktop only */}
                      <Link href="/sell/new" className="hidden sm:flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
                        + Sell
                      </Link>

                      {/* Avatar — desktop */}
                      <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-700">
                        <Link href="/profile" className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center hover:border-indigo-400 transition-colors">
                          <span className="text-xs font-bold text-indigo-400">
                            {user.username[0].toUpperCase()}
                          </span>
                        </Link>
                        <button onClick={handleLogout} className="text-xs text-slate-500 hover:text-white transition-colors">
                          Logout
                        </button>
                      </div>

                      {/* Hamburger — mobile only */}
                      <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="sm:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                      >
                        {menuOpen ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                          </svg>
                        )}
                      </button>
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

          {/* Mobile menu */}
          {menuOpen && user && (
            <div className="sm:hidden border-t border-slate-800 py-3 flex flex-col gap-1">
              <Link href="/listings" onClick={() => setMenuOpen(false)} className="text-slate-400 hover:text-white text-sm px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors">
                Browse
              </Link>
              <Link href="/sell/new" onClick={() => setMenuOpen(false)} className="text-slate-400 hover:text-white text-sm px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors">
                + Sell
              </Link>
              <Link href="/orders" onClick={() => setMenuOpen(false)} className="text-slate-400 hover:text-white text-sm px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors">
                Orders
              </Link>
              <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="text-slate-400 hover:text-white text-sm px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors">
                Dashboard
              </Link>
              <Link href="/profile" onClick={() => setMenuOpen(false)} className="text-slate-400 hover:text-white text-sm px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors">
                Profile
              </Link>
              {user.role.toLowerCase() === "admin" && (
                <Link href="/admin" onClick={() => setMenuOpen(false)} className="text-amber-400 hover:text-amber-300 text-sm px-3 py-2 rounded-xl hover:bg-amber-400/10 transition-colors">
                  Admin
                </Link>
              )}
              <div className="border-t border-slate-800 mt-2 pt-2">
                <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-300 px-3 py-2 transition-colors w-full text-left">
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <ConfirmModal config={modal} onClose={() => setModal(null)} />
    </>
  );
};

export default Navbar;
