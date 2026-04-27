import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
  refunded: [],
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const { status } = await req.json();

    if (!status || typeof status !== "string") {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const orderResult = await pool.query(
      `SELECT id, status
       FROM orders
       WHERE id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const currentStatus = orderResult.rows[0].status;

    if (!ALLOWED_TRANSITIONS[currentStatus]?.includes(status)) {
      return NextResponse.json(
        { error: `Cannot change order from ${currentStatus} to ${status}` },
        { status: 400 }
      );
    }

    const sellerCheck = await pool.query(
      `SELECT 1
       FROM order_items
       WHERE order_id = $1 AND seller_id = $2
       LIMIT 1`,
      [orderId, session.userId]
    );

    const isSellerForOrder = sellerCheck.rows.length > 0;
    const isAdmin = session.role === "admin";

    if (!isSellerForOrder && !isAdmin) {
      return NextResponse.json(
        { error: "You do not have permission to update this order" },
        { status: 403 }
      );
    }

    const updateResult = await pool.query(
      `UPDATE orders
       SET status = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, status, updated_at`,
      [status, orderId]
    );

    return NextResponse.json({
      message: "Order status updated",
      order: updateResult.rows[0],
    });
  } catch (err) {
    console.error("PATCH /api/orders/[id]/status error:", err);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}