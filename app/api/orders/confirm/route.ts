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

    // Verify payment succeeded with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    // Check if webhook already created the order — if so just return success
    const existing = await pool.query(
      "SELECT id FROM orders WHERE stripe_payment_intent_id = $1",
      [paymentIntentId]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json({ success: true, orderId: existing.rows[0].id });
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const retryCheck = await pool.query(
      "SELECT id FROM orders WHERE stripe_payment_intent_id = $1",
      [paymentIntentId]
    );

    if (retryCheck.rows.length > 0) {
      return NextResponse.json({ success: true, orderId: retryCheck.rows[0].id });
    }

    // Webhook still hasn't fired — return success anyway since payment succeeded
    // The webhook will create the order asynchronously
    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("POST /api/orders/confirm error:", err);
    return NextResponse.json({ error: "Failed to confirm order" }, { status: 500 });
  }
}