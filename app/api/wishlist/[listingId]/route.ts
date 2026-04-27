import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ in_wishlist: false });
    }

    const { listingId } = await params;
    const parsedListingId = parseInt(listingId);

    if (isNaN(parsedListingId)) {
      return NextResponse.json({ error: "Invalid listing ID" }, { status: 400 });
    }

    const result = await pool.query(
      `SELECT 1
       FROM wishlist
       WHERE user_id = $1 AND listing_id = $2
       LIMIT 1`,
      [session.userId, parsedListingId]
    );

    return NextResponse.json({
      in_wishlist: result.rows.length > 0,
    });
  } catch (err) {
    console.error("GET /api/wishlist/[listingId] error:", err);
    return NextResponse.json(
      { error: "Failed to check wishlist" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { listingId } = await params;
    const parsedListingId = parseInt(listingId);

    if (isNaN(parsedListingId)) {
      return NextResponse.json({ error: "Invalid listing ID" }, { status: 400 });
    }

    await pool.query(
      `DELETE FROM wishlist
       WHERE user_id = $1 AND listing_id = $2`,
      [session.userId, parsedListingId]
    );

    return NextResponse.json({ message: "Removed from wishlist" });
  } catch (err) {
    console.error("DELETE /api/wishlist/[listingId] error:", err);
    return NextResponse.json(
      { error: "Failed to remove from wishlist" },
      { status: 500 }
    );
  }
}