import Link from "next/link";
import { ReactNode } from "react";
import { requireAdmin } from "@/lib/session";
import PageLayout from "@/components/PageLayout";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin();

  return (
    <PageLayout title="Admin Dashboard" fullWidth>
      <div className="flex gap-8">
        
        {/* Sidebar */}
        <aside className="w-64 space-y-2">
          <Link href="/admin" className="block text-sm hover:text-white text-slate-400">
            Dashboard
          </Link>
          <Link href="/admin/users" className="block text-sm hover:text-white text-slate-400">
            Users
          </Link>
          <Link href="/admin/listings" className="block text-sm hover:text-white text-slate-400">
            Listings
          </Link>
        </aside>

        {/* Content */}
        <div className="flex-1">{children}</div>
      </div>
    </PageLayout>
  );
}