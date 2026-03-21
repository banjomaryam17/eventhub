
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

// Returns platform stats for the admin dashboard
export async function GET() {
  try {
    const session = await requireAdmin();
    if (session instanceof NextResponse) return session;

    // Run all count queries in parallel
    const [usersResult, listingsResult, ordersResult, revenueResult] =
      await Promise.all([
        pool.query("SELECT COUNT(*) FROM users"),
        pool.query("SELECT COUNT(*) FROM listings WHERE is_active = TRUE"),
        pool.query("SELECT COUNT(*) FROM orders"),
        pool.query("SELECT COALESCE(SUM(total_price), 0) AS total FROM orders"),
      ]);

    return NextResponse.json({
      totalUsers:    parseInt(usersResult.rows[0].count),
      totalListings: parseInt(listingsResult.rows[0].count),
      totalOrders:   parseInt(ordersResult.rows[0].count),
      totalRevenue:  parseFloat(revenueResult.rows[0].total).toFixed(2),
    });

  } catch (err) {
    console.error("GET /api/admin/dashboard error:", err);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}