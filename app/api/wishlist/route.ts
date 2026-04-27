import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT
        w.listing_id,
        w.added_at,
        l.title,
        l.price,
        l.condition,
        l.is_active,
        l.average_rating,
        l.review_count,
        c.name AS category_name,
        (
          SELECT li.image_url
          FROM listing_images li
          WHERE li.listing_id = l.id AND li.is_primary = TRUE
          LIMIT 1
        ) AS primary_image
       FROM wishlist w
       JOIN listings l ON l.id = w.listing_id
       JOIN categories c ON c.id = l.category_id
       WHERE w.user_id = $1
       ORDER BY w.added_at DESC`,
      [session.userId]
    );

    return NextResponse.json({ wishlist: result.rows });
  } catch (err) {
    console.error("GET /api/wishlist error:", err);
    return NextResponse.json(
      { error: "Failed to fetch wishlist" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { listing_id } = await req.json();

    if (!listing_id || isNaN(parseInt(listing_id))) {
      return NextResponse.json(
        { error: "Valid listing_id is required" },
        { status: 400 }
      );
    }

    const listingId = parseInt(listing_id);

    const listingResult = await pool.query(
      `SELECT id, seller_id, is_active
       FROM listings
       WHERE id = $1`,
      [listingId]
    );

    if (listingResult.rows.length === 0) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const listing = listingResult.rows[0];

    if (!listing.is_active) {
      return NextResponse.json(
        { error: "You cannot wishlist an inactive listing" },
        { status: 400 }
      );
    }

    if (listing.seller_id === session.userId) {
      return NextResponse.json(
        { error: "You cannot wishlist your own listing" },
        { status: 400 }
      );
    }

    await pool.query(
      `INSERT INTO wishlist (user_id, listing_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, listing_id) DO NOTHING`,
      [session.userId, listingId]
    );

    return NextResponse.json(
      { message: "Added to wishlist" },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/wishlist error:", err);
    return NextResponse.json(
      { error: "Failed to add to wishlist" },
      { status: 500 }
    );
  }
}