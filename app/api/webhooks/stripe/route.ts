import { NextResponse } from "next/server";
import Stripe from "stripe";
import { pool } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  //  Verify webhook came from Stripe 
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

  // Get all cart items
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

  // Calculate item cost total
  const itemCost = items.reduce((sum, item) => {
    return sum + parseFloat(item.price) * item.quantity;
  }, 0);

  const shippingCost = 0; // Free shipping for now — Phase 2
  const totalPrice = itemCost + shippingCost;

  // Create order in a transaction
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Create the order
    const orderResult = await client.query(
      `INSERT INTO orders
        (buyer_id, item_cost, shipping_cost, total_price, status, stripe_payment_intent_id)
       VALUES ($1, $2, $3, $4, 'paid', $5)
       RETURNING id`,
      [
        userId,
        itemCost.toFixed(2),
        shippingCost.toFixed(2),
        totalPrice.toFixed(2),
        paymentIntent.id,
      ]
    );

    const orderId = orderResult.rows[0].id;

    // Insert each order item
    for (const item of items) {
      const subtotal = parseFloat(item.price) * item.quantity;

      await client.query(
        `INSERT INTO order_items
          (order_id, listing_id, seller_id, title_snapshot, price_snapshot, quantity, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          orderId,
          item.listing_id,
          item.seller_id,
          item.title,
          item.price,
          item.quantity,
          subtotal.toFixed(2),
        ]
      );

      // Decrement stock
      await client.query(
        `UPDATE listings SET quantity = quantity - $1 WHERE id = $2`,
        [item.quantity, item.listing_id]
      );

      // Mark inactive if out of stock
      await client.query(
        `UPDATE listings SET is_active = FALSE WHERE id = $1 AND quantity <= 0`,
        [item.listing_id]
      );
    }

    // Clear cart after successful order
    await client.query(
      "DELETE FROM cart_items WHERE cart_id = $1",
      [cartId]
    );

    await client.query("COMMIT");
    console.log(`✅ Order ${orderId} created for user ${userId}`);

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Webhook: failed to create order, rolled back:", err);
  } finally {
    client.release();
  }

  return NextResponse.json({ received: true });
}