import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT
        o.id AS order_id,
        o.status,
        o.created_at,
        o.shipping_cost,
        o.total_price,
        o.delivery_method,
        o.pickup_distance_km,
    
        oi.quantity,
        oi.price_snapshot,
        oi.title_snapshot,
        oi.subtotal,
        oi.listing_id,
    
        buyer.username AS buyer_username,
        buyer.email AS buyer_email,
    
        sa.full_name,
        sa.address_line1,
        sa.address_line2,
        sa.city,
        sa.state,
        sa.postal_code,
        sa.country
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN users buyer ON buyer.id = o.buyer_id
       LEFT JOIN shipping_addresses sa ON sa.id = o.shipping_address_id
       WHERE oi.seller_id = $1
       ORDER BY o.created_at DESC`,
      [session.userId]
    );

    return NextResponse.json({ orders: result.rows });
  } catch (err) {
    console.error("GET /api/seller/orders error:", err);
    return NextResponse.json({ error: "Failed to fetch seller orders" }, { status: 500 });
  }
}