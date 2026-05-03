// app/api/admin/orders/[id]/route.ts

import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

// ── GET /api/admin/orders/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    if (session instanceof NextResponse) return session;

    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const result = await pool.query(
      `SELECT
        o.id,
        o.total_price,
        o.status,
        o.created_at,
        o.stripe_payment_intent_id,
        u.username AS buyer_username,
        u.email    AS buyer_email,
        json_agg(json_build_object(
          'title', oi.title_snapshot,
          'quantity', oi.quantity,
          'price', oi.price_snapshot
        )) AS items
       FROM orders o
       JOIN users u        ON o.buyer_id = u.id
       JOIN order_items oi ON o.id       = oi.order_id
       WHERE o.id = $1
       GROUP BY o.id, u.id`,
      [orderId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order: result.rows[0] });

  } catch (err) {
    console.error("GET /api/admin/orders/[id] error:", err);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

// ── PUT /api/admin/orders/[id] ────────────────────────────────
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    if (session instanceof NextResponse) return session;

    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const body = await req.json();
    const { status } = body;

    const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const existing = await pool.query(
      "SELECT id FROM orders WHERE id = $1",
      [orderId]
    );

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const result = await pool.query(
      "UPDATE orders SET status = $1 WHERE id = $2 RETURNING id, status",
      [status, orderId]
    );

    return NextResponse.json({
      message: `Order ${orderId} status updated to ${status}`,
      order: result.rows[0],
    });

  } catch (err) {
    console.error("PUT /api/admin/orders/[id] error:", err);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}