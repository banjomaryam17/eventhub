import { NextResponse } from "next/server";
import Stripe from "stripe";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { paymentIntentId } = await req.json();
    if (!paymentIntentId) return NextResponse.json({ error: "Missing payment intent" }, { status: 400 });

    // Verify payment actually succeeded with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    // Check order doesn't already exist (webhook may have already created it)
    const existing = await pool.query(
      "SELECT id FROM orders WHERE stripe_payment_intent_id = $1",
      [paymentIntentId]
    );
    if (existing.rows.length > 0) {
      return NextResponse.json({ success: true, orderId: existing.rows[0].id });
    }

    const userId = session.userId;
    const cartId = parseInt(paymentIntent.metadata.cart_id);

    // Get cart items
    const itemsResult = await pool.query(
      `SELECT ci.quantity, ci.listing_id, l.title, l.price, l.seller_id
       FROM cart_items ci
       JOIN listings l ON ci.listing_id = l.id
       WHERE ci.cart_id = $1`,
      [cartId]
    );

    if (itemsResult.rows.length === 0) {
      return NextResponse.json({ error: "Cart empty or already processed" }, { status: 400 });
    }

    const items = itemsResult.rows;
    const itemCost = items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
    const totalPrice = itemCost;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const orderResult = await client.query(
        `INSERT INTO orders (buyer_id, item_cost, shipping_cost, total_price, status, stripe_payment_intent_id)
         VALUES ($1, $2, $3, $4, 'processing', $5) RETURNING id`,
        [userId, itemCost.toFixed(2), "0.00", totalPrice.toFixed(2), paymentIntentId]
      );

      const orderId = orderResult.rows[0].id;

      for (const item of items) {
        const subtotal = parseFloat(item.price) * item.quantity;
        await client.query(
          `INSERT INTO order_items (order_id, listing_id, seller_id, title_snapshot, price_snapshot, quantity, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [orderId, item.listing_id, item.seller_id, item.title, item.price, item.quantity, subtotal.toFixed(2)]
        );
        await client.query(
          `UPDATE listings SET quantity = quantity - $1 WHERE id = $2`,
          [item.quantity, item.listing_id]
        );
        await client.query(
          `UPDATE listings SET is_active = FALSE WHERE id = $1 AND quantity <= 0`,
          [item.listing_id]
        );
      }

      await client.query("DELETE FROM cart_items WHERE cart_id = $1", [cartId]);
      await client.query("COMMIT");

      return NextResponse.json({ success: true, orderId });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("POST /api/orders/confirm error:", err);
    return NextResponse.json({ error: "Failed to confirm order" }, { status: 500 });
  }
}