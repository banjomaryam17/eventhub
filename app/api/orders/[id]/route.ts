import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";

//GET /api/orders/[id] 
// Only the buyer who placed it OR an admin can view it
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const orderId = parseInt(params.id);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    // Get the order
    const orderResult = await pool.query(
      `SELECT
        o.id,
        o.buyer_id,
        o.total_price,
        o.status,
        o.created_at,
        o.stripe_payment_intent_id
       FROM orders o
       WHERE o.id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orderResult.rows[0];
    if (order.buyer_id !== session.userId && session.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get all items in this order
    const itemsResult = await pool.query(
      `SELECT
        oi.id,
        oi.quantity,
        oi.price_snapshot,
        oi.title_snapshot,
        oi.listing_id,
        -- Link back to listing if it still exists
        l.is_active AS listing_still_active,
        (
          SELECT li.image_url
          FROM listing_images li
          WHERE li.listing_id = oi.listing_id AND li.is_primary = TRUE
          LIMIT 1
        ) AS primary_image
       FROM order_items oi
       LEFT JOIN listings l ON oi.listing_id = l.id
       WHERE oi.order_id = $1`,
      [orderId]
    );

    return NextResponse.json({
      order: {
        ...order,
        items: itemsResult.rows,
      },
    });

  } catch (err) {
    console.error("GET /api/orders/[id] error:", err);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}