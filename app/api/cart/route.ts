import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";

// GET /api/cart
// Returns the logged-in user's cart with full listing details
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const result = await pool.query(
      `SELECT
        ci.quantity                 AS cart_quantity,
        ci.added_at,
        l.id                        AS listing_id,
        l.title,
        l.price,
        l.quantity                  AS stock_quantity,
        l.condition,
        l.is_active,
        -- Hide seller if anonymous
        CASE WHEN l.is_anonymous THEN 'Anonymous'
             ELSE u.username END     AS seller_username,
        -- Primary image
        (
          SELECT li.image_url
          FROM listing_images li
          WHERE li.listing_id = l.id AND li.is_primary = TRUE
          LIMIT 1
        ) AS primary_image
       FROM carts c
       JOIN cart_items ci  ON c.id          = ci.cart_id
       JOIN listings l     ON ci.listing_id = l.id
       JOIN users u        ON l.seller_id   = u.id
       WHERE c.user_id = $1
       ORDER BY ci.added_at DESC`,
      [session.userId]
    );

    // Calculate cart total
    const items = result.rows;

    const subtotal = items.reduce((sum, item) => {
    return sum + parseFloat(item.price) * item.cart_quantity;
  }, 0);

  // Discount handling
  const { searchParams } = new URL(req.url);
  const discountCode = searchParams.get("discount");

  let discountPercent = 0;
  let discountAmount = 0;
  let appliedCode: string | null = null;

  if (discountCode) {
    const discountResult = await pool.query(
      `SELECT * FROM discount_codes
      WHERE code = $1
        AND is_active = TRUE
        AND (expires_at IS NULL OR expires_at > NOW())`,
      [discountCode.toUpperCase()]
    );

    if (discountResult.rows.length > 0) {
      discountPercent = discountResult.rows[0].discount_percent;
      discountAmount = (subtotal * discountPercent) / 100;
      appliedCode = discountCode.toUpperCase();
    }
  }

    const total = subtotal - discountAmount;

    return NextResponse.json({
      items,
      summary: {
        item_count: items.length,
        subtotal: parseFloat(subtotal.toFixed(2)),
        discount: parseFloat(discountAmount.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        discount_code: appliedCode,
        discount_percent: discountPercent,
      },
    });

  } catch (err) {
    console.error("GET /api/cart error:", err);
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
  }
}


//POST /api/cart
// Add a listing to the cart (creates cart if it doesn't exist yet)
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { listing_id, quantity = 1 } = body;

    // Validate input
    if (!listing_id || isNaN(parseInt(listing_id))) {
      return NextResponse.json({ error: "Valid listing_id is required" }, { status: 400 });
    }

    const parsedQty = parseInt(quantity);
    if (isNaN(parsedQty) || parsedQty < 1) {
      return NextResponse.json({ error: "Quantity must be at least 1" }, { status: 400 });
    }

    // Check listing exists, is active, has enough stock
    const listingResult = await pool.query(
      "SELECT id, seller_id, quantity, is_active, title FROM listings WHERE id = $1",
      [parseInt(listing_id)]
    );

    if (listingResult.rows.length === 0) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const listing = listingResult.rows[0];

    if (!listing.is_active) {
      return NextResponse.json({ error: "This listing is no longer available" }, { status: 400 });
    }

    // Prevent sellers from adding their own listings to cart
    if (listing.seller_id === session.userId) {
      return NextResponse.json({ error: "You cannot add your own listing to your cart" }, { status: 400 });
    }

    if (listing.quantity < parsedQty) {
      return NextResponse.json(
        { error: `Only ${listing.quantity} item(s) available in stock` },
        { status: 400 }
      );
    }

    //  Get or create cart for user
    await pool.query(
      `INSERT INTO carts (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
      [session.userId]
    );

    const cartResult = await pool.query(
      "SELECT id FROM carts WHERE user_id = $1",
      [session.userId]
    );
    const cartId = cartResult.rows[0].id;
    await pool.query(
      `INSERT INTO cart_items (cart_id, listing_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (cart_id, listing_id)
       DO UPDATE SET quantity = cart_items.quantity + $3`,
      [cartId, parseInt(listing_id), parsedQty]
    );

    // Check the updated quantity doesn't exceed stock
    const cartItemResult = await pool.query(
      "SELECT quantity FROM cart_items WHERE cart_id = $1 AND listing_id = $2",
      [cartId, parseInt(listing_id)]
    );

    if (cartItemResult.rows[0].quantity > listing.quantity) {
      // Roll back to max available stock
      await pool.query(
        "UPDATE cart_items SET quantity = $1 WHERE cart_id = $2 AND listing_id = $3",
        [listing.quantity, cartId, parseInt(listing_id)]
      );
      return NextResponse.json(
        { error: `Only ${listing.quantity} item(s) available — cart updated to maximum` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: `"${listing.title}" added to cart` },
      { status: 201 }
    );

  } catch (err) {
    console.error("POST /api/cart error:", err);
    return NextResponse.json({ error: "Failed to add to cart" }, { status: 500 });
  }
}