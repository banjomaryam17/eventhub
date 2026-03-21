import Link from "next/link";
import { ReactNode } from "react";
import PageLayout from "@/components/PageLayout";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <PageLayout title="Admin Dashboard" fullWidth>
      <div className="flex gap-8">

        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0">
          <nav className="flex flex-col gap-1 sticky top-24">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
              Admin
            </p>
            <Link
              href="/admin"
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-xl transition-colors"
            >
              📊 Dashboard
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-xl transition-colors"
            >
              👥 Users
            </Link>
            <Link
              href="/admin/listings"
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-xl transition-colors"
            >
              🛍 Listings
            </Link>
            <Link
              href="/admin/orders"
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-xl transition-colors"
            >
              📦 Orders
            </Link>
          </nav>
        </aside>

        {/* Page content */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </PageLayout>
  );
}
