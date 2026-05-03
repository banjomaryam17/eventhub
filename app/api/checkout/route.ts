import { NextResponse } from "next/server";
import Stripe from "stripe";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getDrivingDistanceKm } from "@/lib/geo";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const SHIPPING_COST = 4.99;
const PICKUP_RADIUS_KM = parseFloat(process.env.PICKUP_RADIUS_KM ?? "10");

export async function POST(req: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const {
      shipping_address_id,
      discount_code,
      delivery_method = "shipping",
    } = await req.json();

    if (!["shipping", "pickup"].includes(delivery_method)) {
      return NextResponse.json(
        { error: "Invalid delivery method" },
        { status: 400 }
      );
    }

    if (!shipping_address_id || isNaN(parseInt(shipping_address_id))) {
      return NextResponse.json(
        { error: "A valid address is required" },
        { status: 400 }
      );
    }

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

    const addressCheck = await pool.query(
      `SELECT id, latitude, longitude
       FROM shipping_addresses
       WHERE id = $1 AND user_id = $2`,
      [parseInt(shipping_address_id), session.userId]
    );

    if (addressCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 }
      );
    }

    const buyerAddress = addressCheck.rows[0];

    if (delivery_method === "pickup" && (buyerAddress.latitude === null || buyerAddress.longitude === null)) {
  return NextResponse.json(
    { error: "Your address needs location coordinates. Please re-add the address." },
    { status: 400 }
  );
}

    const cartResult = await pool.query(
      "SELECT id FROM carts WHERE user_id = $1",
      [session.userId]
    );

    if (cartResult.rows.length === 0) {
      return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
    }

    const cartId = cartResult.rows[0].id;

    const itemsResult = await pool.query(
      `SELECT
        ci.quantity,
        ci.listing_id,
        l.title,
        l.price,
        l.quantity AS stock_quantity,
        l.is_active,
        l.seller_id,
        l.pickup_latitude,
        l.pickup_longitude,
        u.is_banned AS seller_is_banned
       FROM cart_items ci
       JOIN listings l ON ci.listing_id = l.id
       JOIN users u ON l.seller_id = u.id
       WHERE ci.cart_id = $1`,
      [cartId]
    );

    if (itemsResult.rows.length === 0) {
      return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
    }

    for (const item of itemsResult.rows) {
      if (!item.is_active) {
        return NextResponse.json(
          { error: `"${item.title}" is no longer available` },
          { status: 400 }
        );
      }

      if (item.stock_quantity <= 0) {
        return NextResponse.json(
          { error: `"${item.title}" is out of stock` },
          { status: 400 }
        );
      }

      if (item.quantity > item.stock_quantity) {
        return NextResponse.json(
          { error: `Only ${item.stock_quantity} of "${item.title}" left in stock` },
          { status: 400 }
        );
      }

      if (item.seller_is_banned) {
        return NextResponse.json(
          { error: `"${item.title}" is no longer available — seller account suspended` },
          { status: 400 }
        );
      }

      if (item.seller_id === session.userId) {
        return NextResponse.json(
          { error: `You cannot purchase your own listing "${item.title}"` },
          { status: 400 }
        );
      }
    }

    let maxPickupDistanceKm = 0;

    if (delivery_method === "pickup") {
      for (const item of itemsResult.rows) {
        if (item.pickup_latitude === null || item.pickup_longitude === null) {
          return NextResponse.json(
            { error: `"${item.title}" does not support local pickup` },
            { status: 400 }
          );
        }

        const distanceKm = await getDrivingDistanceKm(
          {
            lat: parseFloat(buyerAddress.latitude),
            lng: parseFloat(buyerAddress.longitude),
          },
          {
            lat: parseFloat(item.pickup_latitude),
            lng: parseFloat(item.pickup_longitude),
          }
        );

        if (distanceKm === null) {
          return NextResponse.json(
            { error: "Could not calculate pickup distance" },
            { status: 400 }
          );
        }

        maxPickupDistanceKm = Math.max(maxPickupDistanceKm, distanceKm);

        if (distanceKm > PICKUP_RADIUS_KM) {
          return NextResponse.json(
            {
              error: `"${item.title}" is too far away for pickup. Pickup is only available within ${PICKUP_RADIUS_KM}km.`,
            },
            { status: 400 }
          );
        }
      }
    }

    const itemTotalCents = itemsResult.rows.reduce((sum, item) => {
      return sum + Math.round(parseFloat(item.price) * 100) * item.quantity;
    }, 0);

    const shippingCents =
      delivery_method === "pickup" ? 0 : Math.round(SHIPPING_COST * 100);

    let discountAmountCents = 0;
    let appliedDiscountCode = "";

    if (discount_code) {
      const discountResult = await pool.query(
        `SELECT id, discount_percent, max_uses, used_count 
         FROM discount_codes
         WHERE code = $1
           AND is_active = TRUE
           AND (expires_at IS NULL OR expires_at > NOW())`,
        [discount_code.toUpperCase()]
      );

      if (discountResult.rows.length > 0) {
        const discount = discountResult.rows[0];

        if (discount.max_uses !== null && discount.used_count >= discount.max_uses) {
          return NextResponse.json(
            { error: "This discount code has reached its maximum uses" },
            { status: 400 }
          );
        }

        const alreadyUsed = await pool.query(
          `SELECT 1
           FROM used_discounts
           WHERE user_id = $1 AND discount_code = $2`,
          [session.userId, discount_code.toUpperCase()]
        );

        if (alreadyUsed.rows.length > 0) {
          return NextResponse.json(
            { error: "You have already used this discount code" },
            { status: 400 }
          );
        }

        discountAmountCents = Math.round(
          (itemTotalCents * discount.discount_percent) / 100
        );
        appliedDiscountCode = discount_code.toUpperCase();
      }
    }

    const totalCents = itemTotalCents + shippingCents - discountAmountCents;

    if (totalCents < 50) {
      return NextResponse.json(
        { error: "Order total must be at least €0.50" },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: "eur",
      metadata: {
        user_id: session.userId.toString(),
        cart_id: cartId.toString(),
        shipping_address_id: parseInt(shipping_address_id).toString(),
        shipping_cost: (shippingCents / 100).toFixed(2),
        discount_code: appliedDiscountCode,
        delivery_method,
        pickup_distance_km: maxPickupDistanceKm.toFixed(2),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      itemTotal: (itemTotalCents / 100).toFixed(2),
      discountAmount: (discountAmountCents / 100).toFixed(2),
      shippingCost: (shippingCents / 100).toFixed(2),
      deliveryMethod: delivery_method,
      pickupDistanceKm: maxPickupDistanceKm.toFixed(2),
      pickupRadiusKm: PICKUP_RADIUS_KM,
      total: (totalCents / 100).toFixed(2),
      itemCount: itemsResult.rows.length,
    });
  } catch (err) {
    console.error("POST /api/checkout error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}