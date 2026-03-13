import { NextResponse } from "next/server";
import Stripe from "stripe";
import { pool } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

//  POST /api/webhooks/stripe
// Stripe calls this endpoint when a payment is confirmed
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  // The webhook secret prevents anyone from faking a payment confirmation
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  //Only handle successful payments
  if (event.type !== "payment_intent.succeeded") {
    return NextResponse.json({ received: true });
  }

  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const userId = parseInt(paymentIntent.metadata.user_id);
  const cartId = parseInt(paymentIntent.metadata.cart_id);

  // 3. Get all cart items
  const itemsResult = await pool.query(
    `SELECT
      ci.quantity,
      ci.listing_id,
      l.title,
      l.price,
      l.seller_id
     FROM cart_items ci
     JOIN listings l ON ci.listing_id = l.id
     WHERE ci.cart_id = $1`,
    [cartId]
  );

  if (itemsResult.rows.length === 0) {
    console.error("Webhook: cart empty for cartId", cartId);
    return NextResponse.json({ received: true });
  }

  const items = itemsResult.rows;
  const total = items.reduce((sum, item) => {
    return sum + parseFloat(item.price) * item.quantity;
  }, 0);

  //  4. Create order and order items in a transaction
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Create the order
    const orderResult = await client.query(
      `INSERT INTO orders
        (buyer_id, total_price, status, stripe_payment_intent_id, stripe_charge_id)
       VALUES ($1, $2, 'paid', $3, $4)
       RETURNING id`,
      [
        userId,
        total.toFixed(2),
        paymentIntent.id,
        paymentIntent.latest_charge?.toString() ?? null,
      ]
    );

    const orderId = orderResult.rows[0].id;

    // Insert each order item with price and title snapshots
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items
          (order_id, listing_id, quantity, price_snapshot, title_snapshot)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, item.listing_id, item.quantity, item.price, item.title]
      );

      // Decrement stock for each purchased listing
      await client.query(
        `UPDATE listings
         SET quantity = quantity - $1
         WHERE id = $2`,
        [item.quantity, item.listing_id]
      );

      // If stock hits 0, mark listing as inactive automatically
      await client.query(
        `UPDATE listings
         SET is_active = FALSE
         WHERE id = $1 AND quantity <= 0`,
        [item.listing_id]
      );
    }

    // Clear the cart after successful order
    await client.query(
      "DELETE FROM cart_items WHERE cart_id = $1",
      [cartId]
    );

    await client.query("COMMIT");

    console.log(`Order ${orderId} created for user ${userId}`);

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Webhook: failed to create order, rolled back:", err);
  } finally {
    client.release();
  }

  return NextResponse.json({ received: true });
}