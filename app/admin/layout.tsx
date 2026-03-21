
import Link from "next/link";
import { ReactNode } from "react";
import PageLayout from "@/components/PageLayout";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <PageLayout title="Admin Dashboard" fullWidth>
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Sidebar — horizontal on mobile, vertical on desktop */}
        <aside className="w-full lg:w-48 flex-shrink-0">
          <nav className="flex flex-row lg:flex-col gap-1 lg:sticky lg:top-24 overflow-x-auto pb-2 lg:pb-0">
            <p className="hidden lg:block text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
              Admin
            </p>
            <Link
              href="/admin"
              className="flex-shrink-0 flex items-center gap-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-xl transition-colors whitespace-nowrap"
            >
              📊 Dashboard
            </Link>
            <Link
              href="/admin/users"
              className="flex-shrink-0 flex items-center gap-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-xl transition-colors whitespace-nowrap"
            >
              👥 Users
            </Link>
            <Link
              href="/admin/listings"
              className="flex-shrink-0 flex items-center gap-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-xl transition-colors whitespace-nowrap"
            >
              🛍 Listings
            </Link>
            <Link
              href="/admin/orders"
              className="flex-shrink-0 flex items-center gap-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-xl transition-colors whitespace-nowrap"
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
