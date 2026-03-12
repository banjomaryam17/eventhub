import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";


// ── PUT /api/cart/[listingId] 
// Update quantity of a specific item in the cart
export async function PUT(
  req: Request,
  { params }: { params: { listingId: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const listingId = parseInt(params.listingId);
    if (isNaN(listingId)) {
      return NextResponse.json({ error: "Invalid listing ID" }, { status: 400 });
    }

    const body = await req.json();
    const parsedQty = parseInt(body.quantity);

    if (isNaN(parsedQty) || parsedQty < 1) {
      return NextResponse.json(
        { error: "Quantity must be at least 1. To remove an item, use DELETE." },
        { status: 400 }
      );
    }

    // Check stock availability
    const listingResult = await pool.query(
      "SELECT quantity FROM listings WHERE id = $1 AND is_active = TRUE",
      [listingId]
    );

    if (listingResult.rows.length === 0) {
      return NextResponse.json({ error: "Listing not found or no longer active" }, { status: 404 });
    }

    if (parsedQty > listingResult.rows[0].quantity) {
      return NextResponse.json(
        { error: `Only ${listingResult.rows[0].quantity} item(s) available in stock` },
        { status: 400 }
      );
    }

    //  Get user's cart
    const cartResult = await pool.query(
      "SELECT id FROM carts WHERE user_id = $1",
      [session.userId]
    );

    if (cartResult.rows.length === 0) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    const cartId = cartResult.rows[0].id;

    // Update quantity 
    const updateResult = await pool.query(
      `UPDATE cart_items SET quantity = $1
       WHERE cart_id = $2 AND listing_id = $3
       RETURNING quantity`,
      [parsedQty, cartId, listingId]
    );

    if (updateResult.rows.length === 0) {
      return NextResponse.json({ error: "Item not found in cart" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Cart updated",
      quantity: updateResult.rows[0].quantity,
    });

  } catch (err) {
    console.error("PUT /api/cart/[listingId] error:", err);
    return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
  }
}


//DELETE /api/cart/[listingId] 
// Remove a specific item from the cart
export async function DELETE(
  req: Request,
  { params }: { params: { listingId: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const listingId = parseInt(params.listingId);
    if (isNaN(listingId)) {
      return NextResponse.json({ error: "Invalid listing ID" }, { status: 400 });
    }

    //Get user's cart 
    const cartResult = await pool.query(
      "SELECT id FROM carts WHERE user_id = $1",
      [session.userId]
    );

    if (cartResult.rows.length === 0) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    const cartId = cartResult.rows[0].id;

    //  Remove item 
    const deleteResult = await pool.query(
      "DELETE FROM cart_items WHERE cart_id = $1 AND listing_id = $2 RETURNING listing_id",
      [cartId, listingId]
    );

    if (deleteResult.rows.length === 0) {
      return NextResponse.json({ error: "Item not found in cart" }, { status: 404 });
    }

    return NextResponse.json({ message: "Item removed from cart" });

  } catch (err) {
    console.error("DELETE /api/cart/[listingId] error:", err);
    return NextResponse.json({ error: "Failed to remove item from cart" }, { status: 500 });
  }
}