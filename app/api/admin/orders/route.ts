// app/api/admin/orders/route.ts

import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

// ── GET /api/admin/orders ─────────────────────────────────────
// Returns all orders on the platform — admin only
export async function GET() {
  try {
    const session = await requireAdmin();
    if (session instanceof NextResponse) return session;

    const result = await pool.query(
      `SELECT
        o.id,
        o.total_price,
        o.status,
        o.created_at,
        o.stripe_payment_intent_id,
        u.id       AS buyer_id,
        u.username AS buyer_username,
        u.email    AS buyer_email,
        COUNT(oi.id) AS item_count
       FROM orders o
       JOIN users u         ON o.buyer_id  = u.id
       LEFT JOIN order_items oi ON o.id   = oi.order_id
       GROUP BY o.id, u.id
       ORDER BY o.created_at DESC`
    );

    return NextResponse.json({ orders: result.rows });

  } catch (err) {
    console.error("GET /api/admin/orders error:", err);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}