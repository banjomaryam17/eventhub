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
        l.id,
        l.title,
        l.price,
        l.quantity,
        l.condition,
        l.is_active,
        l.is_anonymous,
        l.average_rating,
        l.review_count,
        l.created_at,
        c.name AS category_name,
        (
          SELECT li.image_url
          FROM listing_images li
          WHERE li.listing_id = l.id AND li.is_primary = TRUE
          LIMIT 1
        ) AS primary_image
       FROM listings l
       JOIN categories c ON l.category_id = c.id
       WHERE l.seller_id = $1
       ORDER BY l.created_at DESC`,
      [session.userId]
    );

    return NextResponse.json({ listings: result.rows });
  } catch (err) {
    console.error("GET /api/seller/listings error:", err);
    return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
  }
}