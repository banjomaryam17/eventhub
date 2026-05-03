import { NextResponse } from "next/server";
import Stripe from "stripe";
import { pool } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "payment_intent.succeeded") {
    return NextResponse.json({ received: true });
  }

  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  const userId = parseInt(paymentIntent.metadata.user_id);
  const cartId = parseInt(paymentIntent.metadata.cart_id);
  const shippingAddressId = parseInt(
    paymentIntent.metadata.shipping_address_id,
  );
  const shippingCost = parseFloat(paymentIntent.metadata.shipping_cost ?? "0");
  const deliveryMethod = paymentIntent.metadata.delivery_method ?? "shipping";
  const pickupDistanceKm = parseFloat(paymentIntent.metadata.pickup_distance_km ?? "0");

  if (!userId || !cartId || !shippingAddressId) {
    console.error("Webhook missing required metadata:", paymentIntent.metadata);
    return NextResponse.json({ received: true });
  }

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
    [cartId],
  );

  if (itemsResult.rows.length === 0) {
    console.error("Webhook: cart empty for cartId", cartId);
    return NextResponse.json({ received: true });
  }

  const items = itemsResult.rows;

  const itemCost = items.reduce((sum, item) => {
    return sum + parseFloat(item.price) * item.quantity;
  }, 0);

  const totalPrice = itemCost + shippingCost;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existingOrder = await client.query(
      `SELECT id FROM orders WHERE stripe_payment_intent_id = $1`,
      [paymentIntent.id],
    );

    if (existingOrder.rows.length > 0) {
      await client.query("COMMIT");
      return NextResponse.json({ received: true });
    }

    const orderResult = await client.query(
      `INSERT INTO orders
        (
          buyer_id,
          shipping_address_id,
          item_cost,
          shipping_cost,
          discount_applied,
          discount_amount,
          total_price,
          status,
          stripe_payment_intent_id,
          delivery_method,
          pickup_distance_km
        )
       VALUES ($1, $2, $3, $4, FALSE, 0, $5, 'pending', $6, $7, $8)
       RETURNING id`,
      [
        userId,
        shippingAddressId,
        itemCost.toFixed(2),
        shippingCost.toFixed(2),
        totalPrice.toFixed(2),
        paymentIntent.id,
        deliveryMethod,
        pickupDistanceKm.toFixed(2),
      ],
    );

    const orderId = orderResult.rows[0].id;

    for (const item of items) {
      const subtotal = parseFloat(item.price) * item.quantity;

      await client.query(
        `INSERT INTO order_items
          (
            order_id,
            listing_id,
            seller_id,
            title_snapshot,
            price_snapshot,
            quantity,
            subtotal
          )
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          orderId,
          item.listing_id,
          item.seller_id,
          item.title,
          item.price,
          item.quantity,
          subtotal.toFixed(2),
        ],
      );

      await client.query(
        `UPDATE listings
         SET quantity = quantity - $1
         WHERE id = $2`,
        [item.quantity, item.listing_id],
      );

      await client.query(
        `UPDATE listings
         SET is_active = FALSE
         WHERE id = $1 AND quantity <= 0`,
        [item.listing_id],
      );
    }

    await client.query("DELETE FROM cart_items WHERE cart_id = $1", [cartId]);
    // Record discount usage 
    const usedDiscountCode = paymentIntent.metadata.discount_code;
    if (usedDiscountCode) {
      await client.query(
        `INSERT INTO used_discounts (user_id, discount_code, order_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, discount_code) DO NOTHING`,
        [userId, usedDiscountCode, orderId],
      );

      await client.query(
        `UPDATE discount_codes SET used_count = used_count + 1 WHERE code = $1`,
        [usedDiscountCode],
      );
    }

    await client.query("COMMIT");

    console.log(`Order ${orderId} created as pending for user ${userId}`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Webhook: failed to create order, rolled back:", err);
  } finally {
    client.release();
  }

  return NextResponse.json({ received: true });
}
