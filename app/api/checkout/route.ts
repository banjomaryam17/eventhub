// app/api/checkout/route.ts

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// POST /api/checkout
// Validates cart, calculates total, creates a Stripe Payment Intent
// Returns a client_secret the frontend uses to render Stripe Elements
export async function POST() {
  try {
    // 1. Auth check
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    //  Check buyer is not banned
    const buyerCheck = await pool.query(
      "SELECT is_banned FROM users WHERE id = $1",
      [session.userId]
    );

    if (buyerCheck.rows[0]?.is_banned) {
      return NextResponse.json(
        { error: "Your account has been banned. You cannot complete purchases." },
        { status: 403 }
      );
    }

    // Get cart
    const cartResult = await pool.query(
      "SELECT id FROM carts WHERE user_id = $1",
      [session.userId]
    );

    if (cartResult.rows.length === 0) {
      return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
    }

    const cartId = cartResult.rows[0].id;

    // Get cart items with seller ban status 
    const itemsResult = await pool.query(
      `SELECT
        ci.quantity,
        ci.listing_id,
        l.title,
        l.price,
        l.quantity    AS stock_quantity,
        l.is_active,
        l.seller_id,
        u.is_banned   AS seller_is_banned
       FROM cart_items ci
       JOIN listings l ON ci.listing_id = l.id
       JOIN users u    ON l.seller_id   = u.id
       WHERE ci.cart_id = $1`,
      [cartId]
    );

    if (itemsResult.rows.length === 0) {
      return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
    }

    //  Validate every item before charging 
    for (const item of itemsResult.rows) {
      // Listing no longer active
      if (!item.is_active) {
        return NextResponse.json(
          { error: `"${item.title}" is no longer available` },
          { status: 400 }
        );
      }

      // Out of stock
      if (item.stock_quantity <= 0) {
        return NextResponse.json(
          { error: `"${item.title}" is out of stock` },
          { status: 400 }
        );
      }

      // Not enough stock
      if (item.quantity > item.stock_quantity) {
        return NextResponse.json(
          { error: `Only ${item.stock_quantity} of "${item.title}" left in stock` },
          { status: 400 }
        );
      }

      // Seller is banned - block purchase
      if (item.seller_is_banned) {
        return NextResponse.json(
          { error: `"${item.title}" is no longer available — seller account suspended` },
          { status: 400 }
        );
      }

      // Cannot buy own listing
      if (item.seller_id === session.userId) {
        return NextResponse.json(
          { error: `You cannot purchase your own listing "${item.title}"` },
          { status: 400 }
        );
      }
    }

    // Calculate total in cents for Stripe
    const totalCents = itemsResult.rows.reduce((sum, item) => {
      return sum + Math.round(parseFloat(item.price) * 100) * item.quantity;
    }, 0);

    if (totalCents < 50) {
      return NextResponse.json(
        { error: "Order total must be at least €0.50" },
        { status: 400 }
      );
    }

    //  Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: "eur",
      metadata: {
        user_id: session.userId.toString(),
        cart_id: cartId.toString(),
      },
    });

    //  Return client secret to frontend 
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      total: (totalCents / 100).toFixed(2),
      itemCount: itemsResult.rows.length,
    });

  } catch (err) {
    console.error("POST /api/checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}