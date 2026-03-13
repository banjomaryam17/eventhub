import { NextResponse } from "next/server";
import Stripe from "stripe";
import { pool } from "@/lib/db";
import {getSession} from "@/lib/session";
import { error } from "console";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// POST /api/checkout
// Validates cart, calculates total, creates a Stripe Payment Intent
// Returns a client_secret the frontend uses to render Stripe Elements

export async function POST(){
    try
    {
        // Auth check
        const session = await getSession();
        if(!session){
             return NextResponse.json({error: "Not Authenticated"}, {status: 401 });
        }
        // Check cart
    const cartResult = await pool.query(
      "SELECT id FROM carts WHERE user_id = $1",
      [session.userId]
    );
 
    if (cartResult.rows.length === 0) {
      return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
    }
 
    const cartId = cartResult.rows[0].id;

    // Get all cart items with current listing details
    const itemsResult = await pool.query(
      `SELECT
        ci.quantity,
        ci.listing_id,
        l.title,
        l.price,
        l.quantity    AS stock_quantity,
        l.is_active,
        l.seller_id
       FROM cart_items ci
       JOIN listings l ON ci.listing_id = l.id
       WHERE ci.cart_id = $1`,
      [cartId]
    );
 
    if (itemsResult.rows.length === 0) {
      return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
    }

    // Validate listings before buying 
    // Check stock and availability at time of checkout
    // This prevents charging someone for an item that sold out
    for (const item of itemsResult.rows) {
      if (!item.is_active) {
        return NextResponse.json(
          { error: `"${item.title}" is no longer available` },
          { status: 400 }
        );
      }
 
      if (item.quantity > item.stock_quantity) {
        return NextResponse.json(
          { error: `Only ${item.stock_quantity} of "${item.title}" left in stock` },
          { status: 400 }
        );
      }
 
      // Prevent buying your own listing
      if (item.seller_id === session.userId) {
        return NextResponse.json(
          { error: `You cannot purchase your own listing "${item.title}"` },
          { status: 400 }
        );
      }
    }
    // Calculate total in cents for stripe
    // Stripe works in currency's smallest units
    const totalCents = itemsResult.rows.reduce((sum, item) => {
      return sum + Math.round(parseFloat(item.price) * 100) * item.quantity;
    }, 0);
 
    if (totalCents < 50) {
      return NextResponse.json(
        { error: "Order total must be at least €0.50" },
        { status: 400 }
      );
    }
    // Create Stripe payment Intent
    // It stays as "requires_payment_method" until the user pays
     const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: "eur",
      metadata: {
        user_id: session.userId.toString(),
        cart_id: cartId.toString(),
      },
    });
    // Returns client's secret to frontend
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