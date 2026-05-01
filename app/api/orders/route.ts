import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Auto-deliver shipped orders older than 6 days
    await pool.query(
      `UPDATE orders
       SET status = 'delivered', updated_at = CURRENT_TIMESTAMP
       WHERE buyer_id = $1
         AND status = 'shipped'
         AND created_at < NOW() - INTERVAL '6 days'`,
      [session.userId]
    );

    const result = await pool.query(
      `SELECT
        o.id,
        o.status,
        o.total_price,
        o.created_at,
        COUNT(oi.id) AS item_count
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       WHERE o.buyer_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [session.userId]
    );

    return NextResponse.json({ orders: result.rows });
  } catch (err) {
    console.error("GET /api/orders error:", err);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}